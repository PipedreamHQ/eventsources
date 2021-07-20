const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-or-updated-crm-object",
  name: "New or Updated CRM Object",
  description: "Emits an event each time a CRM Object (companies, contacts, deals, products, tickets, line_items, quotes, custom_objects) is updated.",
  version: "0.0.1",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(object) {
      const {
        id,
        updatedAt,
      } = object;
      const ts = Date.parse(updatedAt);
      return {
        id: `${id}${ts}`,
        summary: `Record ID: ${id}`,
        ts,
      };
    },
    isRelevant(object, updatedAfter) {
      return Date.parse(object.updatedAt) > updatedAfter;
    },
    getParams() {
      return null;
    },
    getObjectParams(object) {
      return {
        limit: 100,
        sorts: [
          {
            propertyName: "lastmodifieddate",
            direction: "DESCENDING",
          },
        ],
        object,
      };
    },
    async processResults(after) {
      const crmObjects = this.hubspot.getCRMObjects();
      for (const object of crmObjects) {
        const params = this.getObjectParams(object);
        await this.searchCRM(params, after);
      }
    },
  },
};
