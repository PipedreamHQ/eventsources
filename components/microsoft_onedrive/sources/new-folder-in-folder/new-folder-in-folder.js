const baseNewFileInFolder = require("../new-file-in-folder/new-file-in-folder");
const baseNewFolder = require("../new-folder/new-folder");
const { toSingleLineString } = require("../common/utils");

module.exports = {
  ...baseNewFolder,
  ...baseNewFileInFolder,
  key: "microsoft_onedrive-new-folder-in-folder",
  name: "New Folder in Folder (Instant)",
  description: toSingleLineString(`
    Emit an event when a new folder is created under a
    directory tree in a OneDrive drive
  `),
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...baseNewFolder.props,
    ...baseNewFileInFolder.props,
  },
  methods: {
    ...baseNewFolder.methods,
    ...baseNewFileInFolder.methods,
    getDeltaLinkParams(...args) {
      return baseNewFileInFolder.methods.getDeltaLinkParams.bind(this)(...args);
    },
  },
};
