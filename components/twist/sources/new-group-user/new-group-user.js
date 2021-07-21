const common = require("../common.js");

module.exports = {
  ...common,
  name: "New Group User(Instant)",
  version: "0.0.1",
  key: "twist-new-group-user",
  description: "Emits an event for any new user added to a workspace group.",
  methods: {
    getHookActivationData() {
      return {
        target_url: this.http.endpoint,
        event: "group_user_added",
        workspace_id: this.workspace,
      };
    },
    getMeta(body) {
      const {
        id,
        name,
        user_ids: userIds,
      } = body;
      return {
        id: `${id}${userIds}`,
        summary: name,
        ts: Date.now(),
      };
    },
  },
};
