const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-product-updated",
  name: "Product Updated",
  description: "Emits an event each time a product is updated.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(product) {
      const {
        id,
        properties,
        updatedAt,
      } = product;
      const ts = Date.parse(updatedAt);
      return {
        id: `${id}${ts}`,
        summary: properties.name,
        ts,
      };
    },
    isRelevant(product, updatedAfter) {
      return Date.parse(product.updatedAt) > updatedAfter;
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
        object: "products",
      };
    },
    async processResults(after, params) {
      await this.searchCRM(params, after);
    },
  },
};
