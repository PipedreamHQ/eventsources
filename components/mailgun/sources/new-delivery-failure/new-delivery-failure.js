const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-delivery-failure",
  name: "New Delivery Failure",
  description:
    "Emit an event when an email can't be delivered to the recipient email server.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["permanent_fail", "temporary_fail"];
    },
    getEventType() {
      return ["failed"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        ts,
        summary: `Delivery of msg-id \"${eventPayload.message.headers["message-id"]}\" failed with error: \"${eventPayload["delivery-status"].description}\"`,
      };
    },
    emitEvent(eventWorkload) {
      const eventType = this.getEventType();
      if (eventType.includes(eventWorkload.event)) {
        const meta = this.generateMeta(eventWorkload);
        this.$emit(eventWorkload, meta);
      }
    },
  },
};
