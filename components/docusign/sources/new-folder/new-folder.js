const common = require("../common.js");

module.exports = {
  ...common,
  key: "docusign-new-folder",
  name: "New Folder",
  description: "Emits an event when a new folder is created",
  version: "0.0.1",
  dedupe: "unique",
  methods: {
    ...common.methods,
    _getFolderIds() {
      return this.db.get("folderIds");
    },
    _setFolderIds(folderIds) {
      this.db.set("folderIds", folderIds);
    },
    processFolder(folderIds, folder, ts) {
      if (this.isRelevant(folderIds, folder.folderId)) {
        this.emitEvent(folder, ts);
        folderIds.push(folder.folderId);
      }
      return folderIds;
    },
    isRelevant(folderIds, id) {
      return !folderIds.includes(id);
    },
    generateMeta({
      folderId: id, name: summary,
    }, ts) {
      return {
        id,
        summary,
        ts,
      };
    },
  },
  async run(event) {
    const { timestamp: ts } = event;
    const baseUri = this._getBaseUri();
    let folderIds = this._getFolderIds() || [];
    let done = false;
    const params = {
      start_position: 0,
      include: "envelope_folders,template_folders,shared_template_folders",
      include_items: true,
    };
    do {
      const {
        folders = [],
        nextUri,
        endPosition,
      } = await this.docusign.listFolders(baseUri, params);
      if (nextUri) params.start_position += endPosition + 1;
      else done = true;

      for (const folder of folders) {
        if (folder.hasSubFolders == "true") {
          for (const subfolder of folder.folders) {
            folderIds = this.processFolder(folderIds, subfolder, ts);
          }
        }
        folderIds = this.processFolder(folderIds, folder, ts);
      }
    } while (!done);
    this._setFolderIds(folderIds);
  },
};
