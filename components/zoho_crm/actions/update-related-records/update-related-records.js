const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-update-related-records",
  name: "Update Related Records",
  description:
    "Updates the relation between records from different modules. The following relations are supported: Campaigns - to - Leads, Contacts, Products - to - Leads, Accounts, Contacts, Potentials, Price Books.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    module: {
      type: "string",
      label: "Module",
      description: "Module of the record to relate.",
      options: ["Leads", "Accounts", "Contacts", "Potentials", "Price_Books"],
    },
    recordId: {
      type: "string",
      label: "Record Id",
      description:
        "Unique identifier of the record you'd like to relate to another module.",
    },
    relatedModule: {
      type: "string",
      label: "Related Module",
      description: "Module on which the record will be related to.",
      options: ["Campaigns", "Products"],
    },
    relatedData: {
      type: "object",
      label: "Related Data",
      description:
        'An array with the unique identifier of the record (`id`) in the related module, and its member estatus (`Member_Status`). Example: `[{id:"3652397000000327001",Member_Status:"Active"},{id:"3652397000001854001",Member_Status:"Planning"}]`',
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
      relatedModule: {
        presence: true,
      },
      relatedData: {
        presence: true,
        type: "array",
      },
    };
    const validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        recordId: this.recordId,
        relatedModule: this.relatedModule,
        relatedData: this.relatedData,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.zoho_crm.updateRelatedRecords(
      this.domainLocation,
      this.module,
      this.recordId,
      this.relatedModule,
      this.relatedData
    );
  },
};
