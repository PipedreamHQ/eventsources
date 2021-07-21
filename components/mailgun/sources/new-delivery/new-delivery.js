const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-delivery",
  name: "New Delivery",
  description:
    "Emit an event when an email is sent and accepted by the recipient email server.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["delivered"];
    },
    getEventType() {
      return ["delivered"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        summary: `New Delivery: ${eventPayload.message.headers["message-id"]} by ${eventPayload.envelope.sender}`,
        ts,
      };
    },
  },
};
