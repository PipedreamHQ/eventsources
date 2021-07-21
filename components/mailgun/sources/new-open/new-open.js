const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-open",
  name: "New Open",
  description:
    "Emit an event when the email recipient opened the email and enabled image viewing. Open tracking must be enabled in the Mailgun control panel, and the CNAME record must be pointing to mailgun.org. See more at the Mailgun User's Manual [Tracking Messages](https://documentation.mailgun.com/en/latest/user_manual.html#tracking-messages) section",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["opened"];
    },
    getEventType() {
      return ["OPENED"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        summary: `New Open on message id: ${eventPayload.message.headers["message-id"]} by ${eventPayload.recipient}`,
        ts,
      };
    },
  },
};
