const notion = require("../../notion.app");

module.exports = {
  key: "notion-get-all-users",
  name: "Get All Users",
  description: "Gets details of a user given its identifier.",
  version: "0.0.2",
  type: "action",
  props: {
    notion,
    startCursor: {
      type: "string",
      label: "Start Cursor",
      description:
        "If supplied, a page of results starting after the cursor provided will be returned. Otherwise, the first page of results will be returned.",
      optional: true,
    },
    pageSize: {
      type: "integer",
      label: "Page Size",
      description:
        "The number of items from the full list desired in the response. Maximum: 100",
      min: 1,
      max: 100,
      optional: true,
    },
  },
  async run() {
    return await this.notion.getAllUsers(this.startCursor, this.pageSize);
  },
};
