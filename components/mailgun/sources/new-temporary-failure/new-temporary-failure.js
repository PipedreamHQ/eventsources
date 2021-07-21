const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-temporary-failure",
  name: "New Temporary Failure",
  description:
    "Emit an event when an email can't be delivered to the recipient email server due to a temporary mailbox error such as an ESP block. ESP is the Email Service Provider managing the recipient email server.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["temporary_fail"];
    },
    getEventType() {
      return ["failed"];
    },
    getEventSubtype() {
      return "temporary";
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        ts,
        summary: `Delivery of msg-id \"${eventPayload.message.headers["message-id"]}\" failed with temporary error: \"${eventPayload["delivery-status"].description}\"`,
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
