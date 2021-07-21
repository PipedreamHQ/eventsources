const common = require("../common-webhook");
const { mailchimp } = common.props;

module.exports = {
  ...common,
  key: "mailchimp-new-or-updated-subscriber",
  name: "New Or Updated Subscriber",
  description:
    "Emit an event when a subscriber is added or updated (on profile, or email address change) in an audience list.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    listId: {
      type: "string",
      label: "Audience List Id",
      description:
        "The unique ID of the audience list you'd like to watch for new and updated subscribers.",
    },
    server: { propDefinition: [mailchimp, "server"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["subscribe", "profile", "upemail"];
    },
    getEventType() {
      return ["subscribe", "profile", "upemail"];
    },
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.fired_at);
      let summary;
      if (["subscribe"].includes(eventPayload.type)) {
        summary = `${eventPayload["data[email]"]} subscribed to list ${eventPayload["data[list_id]"]}`;
      } else if (["profile"].includes(eventPayload.type)) {
        summary = `${eventPayload["data[email]"]}'s profile was updated`;
      } else if (["upemail"].includes(eventPayload.type)) {
        summary = `${eventPayload["data[old_email]"]}'s email address changed to ${eventPayload["data[new_email]"]}`;
      } else {
        console.log("Unexpected trigger found, skipping emit");
        return;
      }
      return {
        id: `${eventPayload["data[id]"]}`,
        summary,
        ts,
      };
    },
  },
};
