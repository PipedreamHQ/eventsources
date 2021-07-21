const common = require("../common.js");

module.exports = {
  ...common,
  key: "mongodb-new-field",
  name: "New Field",
  description: "Emits an event when a new field is added to a document",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    database: {
      propDefinition: [
        common.props.mongodb,
        "database",
      ],
    },
    collection: {
      propDefinition: [
        common.props.mongodb,
        "collection",
        (c) => ({
          database: c.database,
        }),
      ],
    },
    document: {
      propDefinition: [
        common.props.mongodb,
        "document",
        (c) => ({
          database: c.database,
          collection: c.collection,
        }),
      ],
    },
  },
  methods: {
    ...common.methods,
    _getFields() {
      return this.db.get("fields");
    },
    _setFields(fields) {
      this.db.set("fields", fields);
    },
    isRelevant(key, fields) {
      return !fields.includes(key);
    },
    async processEvent(client, ts) {
      let fields = this._getFields() || [];
      const db = this.mongodb.getDatabase(client, this.database);
      const collection = this.mongodb.getCollection(db, this.collection);
      const documents = await this.mongodb.listDocuments(collection);
      const doc = documents.find((obj) => {
        return obj._id == this.document;
      });
      const keys = Object.keys(doc);
      for (const key of keys) {
        if (!this.isRelevant(key, fields)) continue;
        fields.push(key);
        this.emitEvent(key, ts);
      }
      this._setFields(fields);
    },
    generateMeta(key, ts) {
      return {
        id: key,
        summary: `New Field ${key}`,
        ts,
      };
    },
  },
};
