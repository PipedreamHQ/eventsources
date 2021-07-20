const common = require("../common.js");

module.exports = {
  ...common,
  key: "firebase_admin_sdk-new-doc-in-firestore-collection",
  name: "New Document in Firestore Collection",
  description: "Emits an event when a structured query returns new documents",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    apiKey: {
      propDefinition: [
        common.props.firebase,
        "apiKey",
      ],
    },
    query: {
      propDefinition: [
        common.props.firebase,
        "query",
      ],
    },
  },
  methods: {
    ...common.methods,
    async processEvent() {
      const structuredQuery = JSON.parse(this.query);

      const queryResults = await this.firebase.runQuery(
        structuredQuery,
        this.apiKey,
      );

      for (const result of queryResults) {
        const meta = this.generateMeta(result);
        this.$emit(result, meta);
      }
    },
    generateMeta({ document }) {
      const {
        name,
        createTime,
      } = document;
      const id = name.substring(name.lastIndexOf("/") + 1);
      return {
        id,
        summary: name,
        ts: Date.parse(createTime),
      };
    },
  },
};
