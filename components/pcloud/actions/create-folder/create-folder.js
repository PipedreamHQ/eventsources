const common = require("../../common");
const { pcloud } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "pcloud-create-folder",
  name: "Create Folder",
  description: "Creates a folder in the specified path or folder.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    folderId: {
      type: "integer",
      label: "Folder Id",
      description: "Id of the parent folder where the new folder will be created.",
      optional: true,
    },
    path: {
      type: "string",
      label: "Path",
      description: "Path to the parent folder, where the new folder will be created.",
      optional: true,
    },
    name: {
      type: "string",
      label: "Name",
      description: "Name of the folder to be created.",
      optional: true,
    }
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
    return await this.pcloud.createFolder(
      this.domainLocation,
      this.folderId,
      this.path,
      this.name
    );
  },
};
