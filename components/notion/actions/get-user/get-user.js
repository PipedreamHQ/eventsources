const notion = require("../../notion.app");

module.exports = {
  key: "notion-get-user",
  name: "Get User",
  description: "Gets details of a user given its identifier.",
  version: "0.0.2",
  type: "action",
  props: {
    notion,
    userId: {
      type: "string",
      label: "User Id",
      description: "Unique identifier of the user to get details of.",
      optional: true,
    },
  },
  async run() {
    if (!this.userId) {
      throw new Error("Must provide userId parameter.");
    }
    return await this.notion.getUser(this.userId);
  },
};
