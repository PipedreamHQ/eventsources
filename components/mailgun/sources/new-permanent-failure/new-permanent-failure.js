const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-permanent-failure",
  name: "New Permanent Failure",
  description:
    "Emit an event when an email can't be delivered to the recipient email server due to a permanent mailbox error such as non-existent mailbox.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["permanent_fail"];
    },
    getEventType() {
      return ["failed"];
    },
    getEventSubtype() {
      return ["permanent"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        ts,
        summary: `Delivery of msg-id \"${eventPayload.message.headers["message-id"]}\" failed with permanent error: \"${eventPayload["delivery-status"].description}\"`,
      };
    },
    emitEvent(eventWorkload) {
      const eventType = this.getEventType();
      const eventSubtype = this.getEventSubtype();
      if (
        eventType.includes(eventWorkload.event) &&
        eventSubtype.includes(eventWorkload.severity)
      ) {
        const meta = this.generateMeta(eventWorkload);
        this.$emit(eventWorkload, meta);
      }
    },
  },
};
