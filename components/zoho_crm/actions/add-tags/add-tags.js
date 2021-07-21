const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-add-tags",
  name: "Add Tags",
  description: "Add new tags to existing module records.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    module: {
      type: "string",
      label: "Module",
      description:
        "The module related to the record you'd like to add tags on.",
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
        "Unique identifiers of the module record you'd like to add tags on.",
    },
    tagNames: {
      type: "string",
      label: "Tag Names",
      description: "Comma separated list of the names of the tags to be added.",
    },
    overWrite: {
      type: "boolean",
      label: "Overwrite?",
      description: "Specifies if the existing tags are to be overwritten.",
      default: false,
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
      module: {
        presence: true,
      },
      recordId: {
        presence: true,
      },
      tagNames: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        recordId: this.recordId,
        tagNames: this.tagNames,
      },
      constraints
    );
    if (validationResult) {
      let validationResultKeys = Object.keys(validationResult);
      let validationMessages;
      if (validationResultKeys.length == 1) {
        validationMessages = validationResult[validationResultKeys[0]];
      } else {
        validationMessages =
          "Parameters validation failed with the following errors:\t";
        validationResultKeys.forEach(
          (validationResultKey) =>
            (validationMessages += `${validationResult[validationResultKey]}\t`)
        );
      }
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.addTags(
      this.domainLocation,
      this.module,
      this.recordId,
      this.tagNames,
      this.overWrite
    );
  },
};
