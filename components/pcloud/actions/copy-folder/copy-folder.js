const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-copy-folder",
  name: "Copy Folder",
  description: "Copies a folder to the specified path or folder.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    folderId: {
      type: "integer",
      label: "Folder Id",
      description: "Id of the source folder.",
      optional: true,
    },
    path: {
      type: "string",
      label: "Path",
      description: "Path of the source folder.",
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
      description: "Destination path.",
      optional: true,
    },
    noOver: {
      type: "integer",
      label: "No Overwrite?",
      description:
        "If it is set and files with the same name already exist, no overwriting will be preformed and error `2004` will be returned.",
      optional: true,
    },
    skipExisting: {
      type: "integer",
      label: "Skip Existing?",
      description: "If set will skip files that already exist.",
      optional: true,
    },
    copyContentOnly: {
      type: "integer",
      label: "Copy Content Only?",
      description:
        "If it is set only the content of source folder will be copied otherwise the folder itself is copied.",
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
    return await this.pcloud.copyFolder(
      this.domainLocation,
      this.folderId,
      this.path,
      this.toFolderId,
      this.toPath,
      this.noOver,
      this.skipExisting,
      this.copyContentOnly
    );
  },
};
