const notion = require("../../notion.app");

module.exports = {
  key: "notion-get-block-children",
  name: "Get Block Children",
  description:
    "Gets a list of child block objects contained in a block given its identifier.",
  version: "0.0.3",
  type: "action",
  props: {
    notion,
    blockId: {
      type: "string",
      label: "Block Id",
      description:
        "Unique identifier of the block to get a list of child block objects from.",
      optional: true,
    },
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
    if (!this.blockId) {
      throw new Error("Must provide blockId parameter.");
    }
    return await this.notion.getBlockChildren(
      this.blockId,
      this.startCursor,
      this.pageSize
    );
  },
};
