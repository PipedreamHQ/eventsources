const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-company",
  name: "New Companies",
  description: "Emits an event for each new company added.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(company) {
      const {
        id,
        properties,
        createdAt,
      } = company;
      const ts = Date.parse(createdAt);
      return {
        id,
        summary: properties.name,
        ts,
      };
    },
    isRelevant(company, createdAfter) {
      return Date.parse(company.createdAt) > createdAfter;
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
        object: "companies",
      };
    },
    async processResults(after, params) {
      await this.searchCRM(params, after);
    },
  },
};
