const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-create-or-update-record",
  name: "Create or Update Record",
  description:
    "Creates or update a record. The fields' values specified in prop `duplicateCheckFields` are used to check for duplicate records.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    module: {
      type: "string",
      label: "Module",
      description: "Module where the record will be updated or created.",
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
      ],
    },
    record: {
      type: "object",
      label: "Record",
      description:
        "The record data that will be used to create a new record, or to update an existing record with matching data in fields as per `duplicateCheckFields` prop.",
    },
    duplicateCheckFields: {
      type: "object",
      label: "Duplicate Check Fields",
      description:
        'The values of the fields specified in this array are used to check for duplicate records. They can be **system-defined duplicate check fields** which are module-wise system-defined, or **user-defined unique fields** fields for which "Do not allow duplicate values" is enabled. See the relevant section in the [Upsert Records API Docs](https://www.zoho.com/crm/developer/docs/api/v2/upsert-records.html), and [User-Custom Fields, Mark Field as Unique](https://help.zoho.com/portal/en/kb/crm/customize-crm-account/customizing-fields/articles/use-custom-fields#Mark_a_Field_as_Unique) article respectively.',
      optional: true,
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
      record: {
        presence: true,
      },
    };
    if (this.duplicateCheckFields) {
      constraints.duplicateCheckFields = {
        type: "array",
      };
    }
    if (this.trigger) {
      constraints.trigger = {
        type: "array",
      };
    }
    let validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        record: this.record,
        duplicateCheckFields: this.duplicateCheckFields,
        trigger: this.trigger
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.upsertRecord(
      this.domainLocation,
      this.module,
      this.record,
      this.duplicateCheckFields,
      this.trigger
    );
  },
};
