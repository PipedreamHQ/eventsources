const common = require("../common.js");

module.exports = {
  ...common,
  key: "mongodb-new-document",
  name: "New Document",
  description: "Emits an event when a new document is added to a collection",
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
  },
  methods: {
    ...common.methods,
    _getDocumentIds() {
      return this.db.get("documentIds");
    },
    _setDocumentIds(documentIds) {
      this.db.set("documentIds", documentIds);
    },
    isRelevant(id, documentIds) {
      return !documentIds.includes(id);
    },
    async processEvent(client, ts) {
      let documentIds = this._getDocumentIds() || [];
      const db = this.mongodb.getDatabase(client, this.database);
      const collection = this.mongodb.getCollection(db, this.collection);
      const documents = await this.mongodb.listDocuments(collection);
      for (const doc of documents) {
        const id = JSON.stringify(doc._id);
        if (!this.isRelevant(id, documentIds)) continue;
        documentIds.push(id);
        this.emitEvent(doc, ts);
      }
      this._setDocumentIds(documentIds);
    },
    generateMeta({ _id: id }, ts) {
      return {
        id,
        summary: `New Document ID ${id}`,
        ts,
      };
    },
  },
};
