const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-company-updated",
  name: "Company Updated",
  description: "Emits an event each time a company is updated.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(company) {
      const {
        id,
        properties,
        updatedAt,
      } = company;
      const ts = Date.parse(updatedAt);
      return {
        id: `${id}${ts}`,
        summary: properties.name,
        ts,
      };
    },
    isRelevant(company, updatedAfter) {
      return Date.parse(company.updatedAt) > updatedAfter;
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
        object: "companies",
      };
    },
    async processResults(after, params) {
      await this.searchCRM(params, after);
    },
  },
};
