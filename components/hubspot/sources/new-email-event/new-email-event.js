const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-email-event",
  name: "New Email Event",
  description: "Emits an event for each new Hubspot email event.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(emailEvent) {
      const {
        id,
        recipient,
        type,
        created,
      } = emailEvent;
      const ts = Date.parse(created);
      return {
        id,
        summary: `${recipient} - ${type}`,
        ts,
      };
    },
    getParams() {
      const startTimestamp = Date.parse(this.hubspot.monthAgo());
      return {
        limit: 100,
        startTimestamp,
      };
    },
    async processResults(after, params) {
      await this.paginateUsingHasMore(
        params,
        this.hubspot.getEmailEvents.bind(this),
        "events",
      );
    },
  },
};
