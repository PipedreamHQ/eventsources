const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-add-attachment",
  name: "Add Attachment",
  description: "Adds a file attachment to the given module record.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    module: {
      type: "string",
      label: "Module",
      description:
        "The module related to the record you'd like to add the attachment.",
      options: [
        "Leads",
        "Accounts",
        "Contacts",
        "Deals",
        "Campaigns",
        "Tasks",
        "Cases",
        "Events",
        "Calls",
        "Solutions",
        "Products",
        "Vendors",
        "Price_Books",
        "Quotes",
        "Sales_Orders",
        "Purchase_Orders",
        "Invoices",
        "Custom",
        "Notes",
      ],
    },
    recordId: {
      type: "string",
      label: "Record Id",
      description:
        "Unique identifier of the record you'd like to add an attachment.",
    },
    fileName: {
      type: "string",
      label: "File Name",
      description:
        "Name of the file you'd like to attach. Pipedream will read the file contents off the workflow's `/tmp` folder.",
    },
  },
  methods: {
    ...common.methods,
  },
  async run() {
    const constraints = {
      recordId: {
        presence: true,
      },
      module: {
        presence: true,
      },
      fileName: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        recordId: this.recordId,
        module: this.module,
        fileName: this.fileName,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.addAttachment(
      this.domainLocation,
      this.module,
      this.recordId,
      this.fileName
    );
  },
};
