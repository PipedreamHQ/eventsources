const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-line-item-updated",
  name: "Line Item Updated",
  description: "Emits an event each time a line item is updated.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(lineItem) {
      const {
        id,
        updatedAt,
      } = lineItem;
      const ts = Date.parse(updatedAt);
      return {
        id: `${id}${ts}`,
        summary: `Line Item ID: ${id}`,
        ts,
      };
    },
    isRelevant(lineItem, updatedAfter) {
      return Date.parse(lineItem.updatedAt) > updatedAfter;
    },
    getParams() {
      return {
        limit: 100,
        sorts: [
          {
            propertyName: "lastmodifieddate",
            direction: "DESCENDING",
          },
        ],
        object: "line_items",
      };
    },
    async processResults(after, params) {
      await this.searchCRM(params, after);
    },
  },
};
