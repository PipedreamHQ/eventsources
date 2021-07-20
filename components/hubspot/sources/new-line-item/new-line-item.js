const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-line-item",
  name: "New Line Item",
  description: "Emits an event for each new line item added.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(lineItem) {
      const {
        id,
        createdAt,
      } = lineItem;
      const ts = Date.parse(createdAt);
      return {
        id,
        summary: `New Line Item ID: ${id}`,
        ts,
      };
    },
    isRelevant(lineItem, createdAfter) {
      return Date.parse(lineItem.createdAt) > createdAfter;
    },
    getParams() {
      return {
        limit: 100,
        sorts: [
          {
            propertyName: "createdate",
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
