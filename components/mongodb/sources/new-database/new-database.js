const common = require("../common.js");

module.exports = {
  ...common,
  key: "mongodb-new-database",
  name: "New Database",
  description: "Emits an event when a new database is added",
  version: "0.0.1",
  dedupe: "unique",
  methods: {
    ...common.methods,
    _getDbNames() {
      return this.db.get("dbNames");
    },
    _setDbNames(dbNames) {
      this.db.set("dbNames", dbNames);
    },
    isRelevant({ name }, dbNames) {
      return !dbNames.includes(name);
    },
    async processEvent(client, ts) {
      let dbNames = this._getDbNames() || [];
      const databases = await this.mongodb.listDatabases(client);
      for (const db of databases) {
        if (!this.isRelevant(db, dbNames)) continue;
        dbNames.push(db.name);
        this.emitEvent(db, ts);
      }
      this._setDbNames(dbNames);
    },
    generateMeta({ name }, ts) {
      return {
        id: name,
        summary: name,
        ts,
      };
    },
  },
};
