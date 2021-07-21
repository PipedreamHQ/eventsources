const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-update-module-record",
  name: "Update Module Record",
  description: "Updates an existing record in the specified module.",
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
    recordId: {
      type: "string",
      label: "Record Id",
      description:
        "Unique identifier of the record you'd like to add an attachment.",
    },
    record: {
      type: "object",
      label: "Record",
      description:
        "The new record data. Depending on the selected module, certain fields must be presented in the record being inserted. I.e. for Leads `Last_Name` is required, see more at Zoho CRM [Insert Records](https://www.zoho.com/crm/developer/docs/api/v2.1/insert-records.html) API docs.",
    },
    trigger: {
      type: "object",
      label: "Trigger",
      description: "An array with the triggers, workflow actions, related to this entry you'd like to be executed. Use an empty array `[]` to not execute any of the workflows.",
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
      recordId: {
        presence: true,
      }      ,
      record: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        recordId: this.recordId,
        record: this.record,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.updateModuleRecord(
      this.domainLocation,
      this.module,
      this.recordId,
      this.record,
      this.trigger

    );
  },
};
