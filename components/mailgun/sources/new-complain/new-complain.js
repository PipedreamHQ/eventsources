const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-complain",
  name: "New Complain",
  description:
    "Emit an event when the email recipient clicked on the spam complaint button within their email client. Feedback loops enable the notification to be received by Mailgun.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["complained"];
    },
    getEventType() {
      return ["complained"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        summary: `New Complain on message id: ${eventPayload.message.headers["message-id"]} by ${eventPayload.recipient}`,
        ts,
      };
    },
  },
};
