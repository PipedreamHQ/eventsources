const twist = require("../../twist.app.js");
const common = require("../common.js");

module.exports = {
  ...common,
  name: "New Event (Instant)",
  version: "0.0.2",
  key: "twist-new-event",
  description: "Emits an event for any new updates in a workspace",
  props: {
    ...common.props,
    channel: {
      propDefinition: [
        twist,
        "channel",
        (c) => ({
          workspace: c.workspace,
        }),
      ],
    },
    thread: {
      propDefinition: [
        twist,
        "thread",
        (c) => ({
          channel: c.channel,
        }),
      ],
    },
    eventType: {
      propDefinition: [
        twist,
        "eventType",
      ],
    },
  },
  methods: {
    getHookActivationData() {
      return {
        target_url: this.http.endpoint,
        event: this.eventType,
        workspace_id: this.workspace,
        channel_id: this.channel,
        thread_id: this.thread,
      };
    },
    getMeta(body) {
      const {
        name,
        id,
        created = Date.now(),
      } = body;
      return {
        id: `${id}${created}`,
        summary: name || "New Event",
        ts: Date.parse(created),
      };
    },
  },
};
