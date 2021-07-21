const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-copy-file",
  name: "Copy File",
  description:
    "Takes one file and copies it as another file in the user's filesystem.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    fileId: {
      type: "integer",
      label: "File Id",
      description: "Id of the file to copy.",
      optional: true,
    },
    path: {
      type: "string",
      label: "Path",
      description: "Path to the file to copy.",
      optional: true,
    },
    toFolderId: {
      type: "integer",
      label: "To Folder Id",
      description: "Id of destination folder.",
      optional: true,
    },
    toPath: {
      type: "string",
      label: "To Path",
      description: "Destination path, including the filename. A new filename can be used. When this is used `toName` is ignored.",
      optional: true,
    },
    toName: {
      type: "string",
      label: "To Name",
      description: "Name of the destination file. This is used only if the destination folder is specified with `toFolderId`.",
      optional: true,
    },
    noOver: {
      type: "integer",
      label: "No Overwrite?",
      description: "If this is set and a file with the specified name already exists, no overwriting will be performed.",
      optional: true,
    },
    modifiedTime: {
      type: "integer",
      label: "Modified Time",
      description: "If specified, file modified time is set. Must be in unix time seconds.",
      optional: true,
    },
    createdTime: {
      type: "integer",
      label: "Created Time",
      description: "If specified, file created time is set. It's required to provide `modifiedTime` to set `createdTime`. Must be in unix time seconds.",
      optional: true,
    },
  },
  methods: {
    ...common.methods,
  },
  async run() {
    const constraints = {
      domainLocation: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.pcloud.copyFile(
      this.domainLocation,
      this.fileId,
      this.path,
      this.toFolderId,
      this.toPath,
      this.toName,
      this.noOver,
      this.modifiedTime,
      this.createdTime,
    );
  },
};
