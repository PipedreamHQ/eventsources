const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-unsubscribe",
  name: "New Unsubscribe",
  description:
    "Emit an event when the email recipient clicked on the unsubscribe link. Unsubscribe tracking must be enabled in the Mailgun control panel. See more at the Mailgun User's Manual [Tracking Messages](https://documentation.mailgun.com/en/latest/user_manual.html#tracking-messages) section",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["unsubscribed"];
    },
    getEventType() {
      return ["UNSUBSCRIBED"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload.id}${ts}`,
        summary: `New Unsubscribe on message id: ${eventPayload.message.headers["message-id"]} by ${eventPayload.recipient}`,
        ts,
      };
    },
  },
};
