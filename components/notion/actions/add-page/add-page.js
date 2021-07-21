const notion = require("../../notion.app");

module.exports = {
  key: "notion-add-page",
  name: "Add Page",
  description:
    "Adds a new page to the specified parent object, a database or an existing page.",
  version: "0.0.18",
  type: "action",
  props: {
    notion,
    parent: {
      type: "object",
      label: "Parent",
      description:
        "The new page [database parent](https://developers.notion.com/reference/page#database-parent) or [page parent](https://developers.notion.com/reference/page#page-parent) object.",
    },
    propertyValues: {
      type: "object",
      label: "Property Values",
      description:
        "Property values of the page being added. The keys are the names or IDs of the [property](https://developers.notion.com/reference-link/database-property) and the values are [property values](https://developers.notion.com/reference-link/page-property-value).",
    },
    children: {
      type: "string",
      label: "Children",
      description:
        'A JSON-based array of [block objects](https://developers.notion.com/reference-link/block) to use as page content. Example `[{"object":"block","type":"paragraph","paragraph":{"text":[{"type":"text","text":{"content":"This is the paragraph content"}}]}}]`',
      optional: true,
    },
  },
  async run() {
    if (!this.parent || !this.propertyValues) {
      throw new Error("Must provide parent and propertyValues parameters.");
    }
    const children = this.children ? JSON.parse(this.children) : null;
    return await this.notion.addPage(
      this.parent,
      this.propertyValues,
      children
    );
  },
};
