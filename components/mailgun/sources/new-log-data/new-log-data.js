const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-log-data",
  name: "New Log Data",
  description:
    "Emit an event when new data is logged in Mailgun's Control Panel. Occurs for most actions within the associated Mailgun account.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailgun,
    domain: { propDefinition: [mailgun, "domain"] },
    baseRegion: { propDefinition: [mailgun, "baseRegion"] },
    timer: { propDefinition: [mailgun, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      let mailgunEvents = await this.mailgun.getMailgunEvents(
        this.domain,
        null,
        10
      );
      if (mailgunEvents.items.length === 0) {
        console.log(`No data available, skipping iteration`);
        return;
      }
      mailgunEvents.items.forEach(this.emitEvent);
      const last = new String(mailgunEvents.paging.last);
      let idxSlash = last.lastIndexOf("/");
      let lastUrlPart = last.substring(idxSlash + 1);
      mailgunEvents = await this.mailgun.getMailgunEvents(
        this.domain,
        lastUrlPart,
        10
      );
      this.db.set("next", mailgunEvents.paging.next);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: eventPayload.id,
        summary: `New data logged ${eventPayload.event}, with log-level: ${eventPayload["log-level"]}`,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    let next = this.db.get("next");
    let mailgunEvents = null;
    do {
      let nextUrlPart = "";
      if (next) {
        const idxSlash = next.lastIndexOf("/");
        nextUrlPart = next.substring(idxSlash + 1);
      }
      mailgunEvents = await this.mailgun.getMailgunEvents(
        this.domain,
        nextUrlPart,
        10
      );
      if (mailgunEvents.items.length === 0) {
        console.log(`No data available, skipping iteration`);
        break;
      }
      this.db.set("next", mailgunEvents.paging.next);
      next = mailgunEvents.paging.next;
      mailgunEvents.items.forEach(this.emitEvent);
    } while (mailgunEvents.items.length > 0);
  },
};
