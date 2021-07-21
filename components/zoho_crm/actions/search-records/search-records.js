const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "zoho_crm-search-records",
  name: "Search Records",
  description: "Retrieve the records that match your search criteria.",
  version: "0.0.1",
  type: "action",
  props: {
    zoho_crm,
    domainLocation: { propDefinition: [zoho_crm, "domainLocation"] },
    criteria: {
      type: "string",
      label: "Search Criteria",
      description:
        "Your search will be performed using the criteria enter here. It must match the following pattern: `(({api_name}:{starts_with|equals}:{value})and/or({api_name}:{starts_with|equals}:{value}))`. Example: `((Last_Name:equals:Burns%5C%2CB)and(First_Name:starts_with:M))`",
    },
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
      default: "Leads",
    },
    converted: {
      type: "string",
      label: "Converted",
      description:
        "Determines whether converted records should be retrieved. `Yes` - get only converted records. `No` - get only non-converted records. `Both` -  get all records ",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
        { label: "Both", value: "both" },
      ],
      default: "No",
    },
    approved: {
      type: "string",
      label: "Approved",
      description:
        "Determines whether approved records should be retrieved. `Yes` - get only approved records. `No` - get only non-approved records. `Both` -  get all records ",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
        { label: "Both", value: "both" },
      ],
      default: "Yes",
    },
    numberOfRecords: {
      type: "integer",
      label: "Number of Records",
      description: "The number of module records to return.",
    },
    fields: {
      type: "string",
      label: "Fields",
      description:
        "Comma separated list of the fields you'd like to retrieve in the records matching your search.",
      optional: true
    },
  },
  methods: {
    ...common.methods,
  },
  async run() {
    const constraints = {
      criteria: {
        presence: true,
      },
      numberOfRecords: {
        presence: true,
      },
    };
    const validationResult = validate(
      { criteria: this.criteria, numberOfRecords: this.numberOfRecords },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    const searchResultsGenerator = this.zoho_crm.searchRecords(
      this.domainLocation,
      this.module,
      this.criteria,
      this.numberOfRecords,
      this.converted,
      this.approved,
      this.fields
    );
    const searchResults = await this.getGeneratorResults(searchResultsGenerator);
    return searchResults.slice(0, this.numberOfRecords);
  },
};
