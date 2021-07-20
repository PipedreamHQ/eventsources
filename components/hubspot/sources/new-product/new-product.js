const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-product",
  name: "New Products",
  description: "Emits an event for each new product created.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(product) {
      const {
        id,
        properties,
        createdAt,
      } = product;
      const ts = Date.parse(createdAt);
      return {
        id,
        summary: properties.name,
        ts,
      };
    },
    isRelevant(product, createdAfter) {
      return Date.parse(product.createdAt) > createdAfter;
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
        object: "products",
      };
    },
    async processResults(after, params) {
      await this.searchCRM(params, after);
    },
  },
};
