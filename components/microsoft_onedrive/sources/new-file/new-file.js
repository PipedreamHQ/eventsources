const common = require("../common/base");

module.exports = {
  ...common,
  key: "microsoft_onedrive-new-file",
  name: "New File (Instant)",
  description: "Emit an event when a new file is added to a specific drive in OneDrive",
  version: "0.0.2",
  dedupe: "unique",
  hooks: {
    ...common.hooks,
    async activate() {
      await common.hooks.activate.bind(this)();
      this._setLastCreatedTimestamp();
    },
  },
  methods: {
    ...common.methods,
    _getLastCreatedTimestamp() {
      return this.db.get("lastCreatedTimestamp") || 0;
    },
    _setLastCreatedTimestamp(lastCreatedTimestamp = Date.now()) {
      this.db.set("lastCreatedTimestamp", lastCreatedTimestamp);
    },
    _getMaxCreatedTimestamp() {
      return this.db.get("maxCreatedTimestamp") || 0;
    },
    _setMaxCreatedTimestamp(maxCreatedTimestamp = Date.now()) {
      this.db.set("maxCreatedTimestamp", maxCreatedTimestamp);
    },
    isItemTypeRelevant(driveItem) {
      return !driveItem.deleted;
    },
    isItemRelevant(driveItem) {
      // Drive items that were created prior to the latest cached creation time
      // are not relevant to this event source
      const { createdDateTime } = driveItem;
      const createdTimestamp =  Date.parse(createdDateTime);
      return createdTimestamp > this._getLastCreatedTimestamp();
    },
    generateMeta(driveItem) {
      const {
        id,
        createdDateTime,
        name,
      } = driveItem;
      const summary = `New file: ${name}`;
      const ts = Date.parse(createdDateTime);
      return {
        id,
        summary,
        ts,
      };
    },
    processEvent(driveItem) {
      const meta = this.generateMeta(driveItem);
      this.$emit(driveItem, meta);

      const { createdDateTime } = driveItem;
      const createdTimestamp = Date.parse(createdDateTime);
      if (createdTimestamp > this._getMaxCreatedTimestamp()) {
        this._setMaxCreatedTimestamp(createdTimestamp);
      }
    },
    postProcessEvent() {
      const maxCreatedTimestamp = this._getMaxCreatedTimestamp();
      this._setLastCreatedTimestamp(maxCreatedTimestamp);
    },
  },
};
