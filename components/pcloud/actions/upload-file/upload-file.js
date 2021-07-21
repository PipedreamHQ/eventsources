const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-upload-file",
  name: "Upload File",
  description:
    "Uploads a file to the specified folder in the `folderId` or `path` parameters.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    path: {
      type: "string",
      label: "Path",
      description:
        "Path to the folder where the file will be uploaded (discouraged). If neither `path` nor `folderid` are specified, the root folder will be used.",
      optional: true,
    },
    folderId: {
      type: "integer",
      label: "Folder Id",
      description:
        "Id of the folder where the file will be uploaded. If neither `path` nor `folderid` are specified, the root folder will be used.",
      optional: true,
    },
    filename: {
      type: "string",
      label: "Filename",
      description:
        "Name of the file to upload. Within the associated Pipedream workflow, the file to upload exist under the `/tmp` directory.",
    },
    noPartial: {
      type: "integer",
      label: "No Partial Upload",
      description: "If is set, partially uploaded files will not be saved.",
      optional: true,
    },
    progressHash: {
      type: "string",
      label: "Progress Hassh",
      description: "Used for observing upload progress.",
      optional: true,
    },
    renameIfExists: {
      type: "integer",
      label: "Rename if Exists",
      description:
        "If set, the uploaded file will be renamed, if file with the requested name exists in the folder.",
      optional: true,
    },
    mtime: {
      type: "integer",
      label: "Modified Time",
      description:
        "If set, file modified time is set. Must be a unix timestamp.",
      optional: true,
    },
    ctime: {
      type: "integer",
      label: "Modified Time",
      description:
        "If set, file created time is set. Must be a unix timestamp. It's required to provide `mtime` to set `ctime`.",
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
      filename: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        filename: this.filename,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.pcloud.uploadFile(
      this.domainLocation,
      this.path,
      this.folderId,
      this.filename,
      this.noPartial,
      this.progressHash,
      this.renameIfExists,
      this.mtime,
      this.ctime
    );
  },
};
