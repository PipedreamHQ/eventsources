const notion = require("../../notion.app");

module.exports = {
  key: "notion-add-content-to-page-or-block",
  name: "Add Content To Page Or Block",
  description:
    "Adds content to a specified page or block. In Notion, content is added via [blocks](https://developers.notion.com/reference/block), which can be headings, paragraphs, lists to dos, etc.",
  version: "0.0.4",
  type: "action",
  props: {
    notion,
    blockId: {
      type: "string",
      label: "Page or Block Id",
      description: "Unique identifier of the page or block to add content to.",
    },
    content: {
      type: "string",
      label: "Content",
      description:
        'A JSON-based array of content to be added to a page (or container block). Example `[{"object":"block","type":"heading_2","heading_2":{"text":[{"type":"text","text":{"content":"Sample content"}}]}}]`',
    },
  },
  async run() {
    if (!this.blockId || !this.content) {
      throw new Error("Must provide pageId and content parameters.");
    }
    const content = JSON.parse(this.content);
    return await this.notion.addContentToPageOrBlock(this.blockId, content);
  },
};
