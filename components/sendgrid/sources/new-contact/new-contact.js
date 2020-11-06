const last = require("lodash/last");
const orderBy = require("lodash/orderBy");

const common = require("../common");

module.exports = {
  ...common,
  key: "sendgrid-new-contact",
  name: "New Contact (Instant)",
  description: "Emit and event when a new contact is created",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    limit: {
      type: "integer",
      label: "Limit",
      description: "The maximum number of new contacts to process on each iteration (max. 50)",
      optional: true,
      default: 50,
    },
  },
  hooks: {
    async activate() {
      if (this.limit <= 0 || this.limit > 50) {
        throw new Error(`
          Incorrect value for "limit" prop.
          The value should be greater than 0 and no greater than 50.
        `);
      }

      const currentTimestamp = Date.now();
      const state = {
        processedItems: [],
        lowerTimestamp: currentTimestamp,
        upperTimestamp: currentTimestamp,
      };
      this.db.set("state", state);
    },
  },
  methods: {
    ...common.methods,
    _maxDelayTime() {
      // There is no report from SendGrid as to how much time it takes
      // for a contact to be created and appear in search results, so
      // we're using a rough estimate of 30 minutes here.
      return 30 * 60 * 1000;  // 30 minutes, in milliseconds
    },
    _addDelayOffset(timestamp) {
      return timestamp - this._maxDelayTime();
    },
    _cleanupOldProcessedItems(processedItems, currentTimestamp) {
      return processedItems
        .map(item => ({
          // We just need to keep track of the record ID and
          // its creation date.
          id: item.id,
          created_at: item.created_at,
        }))
        .filter(item => {
          const { created_at: createdAt } = item;
          const createdAtTimestamp = Date.parse(createdAt);
          const cutoffTimestamp = this._addDelayOffset(currentTimestamp);
          return createdAtTimestamp > cutoffTimestamp;
        });
    },
    _makeSearchQuery(processedItems, lowerTimestamp, upperTimestamp) {
      const idList = processedItems
        .map(item => item.id)
        .map(id => `'${id}'`)
        .join(', ')
      || "''";
      const startTimestamp = this._addDelayOffset(lowerTimestamp);
      const startDate = this.toISOString(startTimestamp);
      const endDate = this.toISOString(upperTimestamp);
      return `
        contact_id NOT IN (${idList}) AND
        created_at BETWEEN
          TIMESTAMP '${startDate}' AND
          TIMESTAMP '${endDate}'
      `;
    },
    generateMeta(data) {
      const {
        item,
        eventTimestamp: ts,
      } = data;
      const {
        id,
        email,
      } = item;
      const slugifiedEmail = this.slugifyEmail(email);
      const summary = `New contact: ${slugifiedEmail}`;
      return {
        id,
        summary,
        ts,
      };
    },
    async processEvent(event) {
      // Transform the timer timestamp to milliseconds
      // to be consistent with how Javascript handles timestamps.
      const eventTimestamp = event.timestamp * 1000;

      // Retrieve the current state of the component.
      const {
        processedItems,
        lowerTimestamp,
        upperTimestamp,
      } = this.db.get("state");

      // Search for contacts within a specific timeframe, excluding
      // items that have already been processed.
      const query = this._makeSearchQuery(processedItems, lowerTimestamp, upperTimestamp);
      const {
        result: items,
        contact_count: contactCount,
      } = await this.sendgrid.searchContacts(query);

      // If no contacts have been retrieved via the API,
      // move the time window forward to possibly capture newer contacts.
      if (contactCount === 0) {
        const newState = {
          processedItems: this._cleanupOldProcessedItems(processedItems, lowerTimestamp),
          lowerTimestamp: upperTimestamp,
          upperTimestamp: eventTimestamp,
        };
        this.db.set("state", newState);
        return;
      }

      // Limit the amount of items to process based on the
      // **limit** parameter provided by the user, starting from
      // the oldest record.
      const itemsToProcess = orderBy(items, 'created_at')
        .slice(0, this.limit);
      itemsToProcess
        .forEach(item => {
          const meta = this.generateMeta({ item, eventTimestamp });
          this.$emit(item, meta);
        });

      // Use the timestamp of the last processed record as a lower bound for
      // following searches. This bound will be subjected to an offset so in
      // case older records appear in future search results, but have not
      // appeared until now, can be processed. We only adjust it if it means
      // moving forward, not backwards. Otherwise, we might start retrieving
      // older and older records indefinitely (and we're all about *new*
      // records!)
      const newLowerTimestamp = Math.max(
        lowerTimestamp,
        Date.parse(itemsToProcess[0].created_at),
      );

      // If the expected remaining records to be returned by the
      // next search is not enough to fill the **limit** quota,
      // we need to extend the time range forward.
      const newUpperTimestamp = contactCount < 2 * this.limit ? eventTimestamp : upperTimestamp;

      // The list of processed items can grow indefinitely.
      // Since we don't want to keep track of every processed record
      // ever, we need to clean up this list, removing any records
      // that are no longer relevant.
      const newProcessedItems = this._cleanupOldProcessedItems(
        [...processedItems, ...itemsToProcess],
        newLowerTimestamp,
      );

      // Update the state of the component to reflect the computations
      // made above.
      const newState = {
        processedItems: newProcessedItems,
        lowerTimestamp: newLowerTimestamp,
        upperTimestamp: newUpperTimestamp,
      };
      this.db.set("state", newState);
    },
  },
};
