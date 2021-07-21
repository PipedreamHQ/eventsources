const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-create-module-record",
  name: "Create Module Record",
  description: "Creates a new record in the specified module.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    module: {
      type: "string",
      label: "Module",
      description: "Module where the record will be created.",
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
      default: "Leads",
    },
    record: {
      type: "object",
      label: "Record",
      description:
        "The new record data. Depending on the selected module, certain fields must be presented in the record being created. I.e. for Leads `Last_Name` is required, see more at Zoho CRM [Insert Records](https://www.zoho.com/crm/developer/docs/api/v2.1/insert-records.html) API docs.",
    },
    trigger: {
      type: "object",
      label: "Trigger",
      description: "An array with the triggers, workflow actions, related to this record you'd like to be executed. Use an empty array `[]` to not execute any of the workflows.",
      optional: true
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
      module: {
        presence: true,
      },
      record: {
        presence: true,
      },
    };
    if (this.trigger) {
      constraints.trigger = {
        type: "array",
      };
    }
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        record: this.record,
        trigger: this.trigger
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.createModuleRecord(
      this.domainLocation,
      this.module,
      this.record,
      this.trigger
    );
  },
};
