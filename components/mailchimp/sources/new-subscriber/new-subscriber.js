const common = require("../common-webhook");
const { mailchimp } = common.props;

module.exports = {
  ...common,
  key: "mailchimp-new-subscriber",
  name: "New Subscriber",
  description: "Emit an event when a subscriber is added to an audience list.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    listId: {
      type: "string",
      label: "Audience List Id",
      description:
        "The unique ID of the audience list you'd like to watch for new subscribers.",
    },
    server: { propDefinition: [mailchimp, "server"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["subscribe"];
    },
    getEventType() {
      return ["subscribe"];
    },
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.fired_at);
      return {
        id: `${eventPayload["data[id]"]}`,
        summary: `${eventPayload["data[email]"]} subscribed to list ${eventPayload["data[list_id]"]}`,
        ts,
      };
    },
  },
};
