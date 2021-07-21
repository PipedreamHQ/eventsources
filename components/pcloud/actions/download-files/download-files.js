const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-download-file",
  name: "Download File",
  description:
    "Downloads one or more files from links suplied in the url parameter.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    urls: {
      type: "string",
      label: "URLs",
      description: "URLs of the files to download, separated by whitespaces.",
    },
    path: {
      type: "string",
      label: "Path",
      description:
        "Path to folder, in which to download the files. If `path` or `folderId` are not present, then root folder is used",
      optional: true,
    },
    folderId: {
      type: "string",
      label: "Files",
      description: "Id of the folder, in which to download the files.",
      optional: true,
    },
    targetFilenames: {
      type: "string",
      label: "Target Filenames",
      description:
        "Desired names for the downloaded files, separated by commas.",
      optional: true,
    },
  },
  methods: {
    ...common.methods
  },
  async run() {
    const constraints = {
      domainLocation: {
        presence: true,
      },
      urls: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        urls: this.urls,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.pcloud.downloadFiles(
      this.domainLocation,
      this.urls,
      this.path,
      this.folderId,
      this.targetFilenames
    );
  },
};
