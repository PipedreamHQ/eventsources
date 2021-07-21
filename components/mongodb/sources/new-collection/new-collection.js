const common = require("../common.js");

module.exports = {
  ...common,
  key: "mongodb-new-collection",
  name: "New Collection",
  description: "Emits an event when a new collection is added to a database",
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
  },
  methods: {
    ...common.methods,
    _getCollectionIds() {
      return this.db.get("collectionIds");
    },
    _setCollectionIds(collectionIds) {
      this.db.set("collectionIds", collectionIds);
    },
    isRelevant(uuid, collectionIds) {
      return !collectionIds.includes(uuid);
    },
    async processEvent(client, ts) {
      let collectionIds = this._getCollectionIds() || [];
      const db = this.mongodb.getDatabase(client, this.database);
      const collections = await this.mongodb.listCollections(db);
      for (const collection of collections) {
        const uuid = JSON.stringify(collection.info.uuid);
        if (!this.isRelevant(uuid, collectionIds)) continue;
        collectionIds.push(uuid);
        this.emitEvent(collection, ts);
      }
      this._setCollectionIds(collectionIds);
    },
    generateMeta({
      info, name,
    }, ts) {
      return {
        id: info.uuid,
        summary: name,
        ts,
      };
    },
  },
};
