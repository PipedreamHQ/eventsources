const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-mailing-list",
  name: "New Mailing List",
  description:
    "Emit an event when a new mailing list is added to the associated Mailgun account.",
  version: "0.0.1",
  dedupe: "greatest",
  props: {
    ...common.props,
    baseRegion: { propDefinition: [mailgun, "baseRegion"] },
    timer: { propDefinition: [mailgun, "timer"] },
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailgunLists = await this.mailgun.getMailgunLists("last", 5);
      if (!mailgunLists || mailgunLists.items.length === 0) {
        console.log("No data available, skipping iteration");
        return;
      }
      const { items: mailgunListItems = [] } = mailgunLists;
      mailgunListItems.forEach(this.emitEvent);
      this.db.set("next", mailgunLists.paging.next);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.created_at);
      return {
        id: `${ts}`,
        summary: `A new mailing list "${eventPayload.name}" has been created.`,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    let mailgunLists;
    let next = null;
    let address = null;
    let page = "first";
    do {
      if (next) {
        const nextUrlParams = new URLSearchParams(next);
        address = nextUrlParams.get("address");
        page = "next";
      }
      mailgunLists = await this.mailgun.getMailgunLists(page, 5, address);
      if (!mailgunLists || mailgunLists.items.length === 0) {
        console.log("No data available, skipping iteration");
        break;
      }
      mailgunLists.items.forEach(this.emitEvent);
      this.db.set("next", mailgunLists.paging.next);
      next = this.db.get("next");
    } while (mailgunLists.items.length > 0);
  },
};
