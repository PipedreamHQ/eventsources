const get = require("lodash/get");

const base = require("../new-file-in-folder/new-file-in-folder");
const { toSingleLineString } = require("../common/utils");
const { mimeTypes } = require("./mime-types");

module.exports = {
  ...base,
  key: "microsoft_onedrive-new-file-of-types-in-folder",
  name: "New File of Types in Folder (Instant)",
  description: toSingleLineString(`
    Emit an event when a new file of a specific type is created
    under a directory tree in a OneDrive drive
  `),
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...base.props,
    folder: {
      ...base.props.folder,
      description: toSingleLineString(`
        The OneDrive folder to watch for new files (leave empty to watch the
        entire drive)
      `),
      optional: true,
    },
    fileTypes: {
      type: "string[]",
      label: "Drive Item Types",
      description: "The types of files that the event source will watch",
      options: mimeTypes,
    },
  },
  methods: {
    ...base.methods,
    isItemTypeRelevant(driveItem) {
      const fileType = get(driveItem, [
        "file",
        "mimeType",
      ]);
      return (
        base.methods.isItemTypeRelevant.bind(this)(driveItem) &&
        this.fileTypes.includes(fileType)
      );
    },
  },
};
