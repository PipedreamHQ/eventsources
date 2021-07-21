const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-list-contents",
  name: "List Contents.",
  description: "Lists the metadata of the specified folder's contents.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    path: {
      type: "string",
      label: "Path",
      description:
        "Path to the folder list contents. If `path` or `folderId` are not present, then root folder is used.",
      optional: true,
    },
    folderId: {
      type: "integer",
      label: "Files",
      description: "Id of the folder to list contents.",
      optional: true,
    },
    recursive: {
      type: "integer",
      label: "Recursive?",
      description:
        "If is set full directory tree will be returned, which means that all directories will have contents filed.",
      optional: true,
    },
    showdeleted: {
      type: "integer",
      label: "Show Deleted?",
      description:
        "If is set, deleted files and folders that can be undeleted will be displayed.",
      optional: true,
    },
    nofiles: {
      type: "integer",
      label: "No Files?",
      description:
        "If is set, only the folder (sub)structure will be returned.",
      optional: true,
    },
    noshares: {
      type: "integer",
      label: "No Shares?",
      description:
        "If is set, only user's own folders and files will be displayed.",
      optional: true,
    },
  },
  methods: {
    ...common.methods,
  },
  async run() {
    return await this.pcloud.listContents(
      this.domainLocation,
      this.path,
      this.folderId,
      this.recursive,
      this.showdeleted,
      this.nofiles,
      this.noshares
    );
  },
};
