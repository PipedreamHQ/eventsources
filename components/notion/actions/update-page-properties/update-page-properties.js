const notion = require("../../notion.app");

module.exports = {
  key: "notion-update-page-properties",
  name: "Update Page Properties",
  description: "Updates the property values of the specified page.",
  version: "0.0.5",
  type: "action",
  props: {
    notion,
    pageId: {
      type: "string",
      label: "Page Id",
      description:
        "Unique identifier of the page to update its property values.`",
    },
    properties: {
      type: "object",
      label: "Properties",
      description:
        'An object with property values to update for this page. The object keys are the names or IDs of the [property](https://developers.notion.com/reference-link/database-property) and the values are [property values](https://developers.notion.com/reference-link/page-property-value). Example `{"In stock":{"checkbox":true}}`',
    },
  },
  async run() {
    if (!this.pageId || !this.properties) {
      throw new Error("Must provide pageId and properties parameters.");
    }
    return await this.notion.updatePageProperties(this.pageId, this.properties);
  },
};
