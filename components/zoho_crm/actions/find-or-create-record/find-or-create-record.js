const common = require("../common");
const { zoho_crm } = common.props;
const validate = require("validate.js");
const get = require("lodash/get");

module.exports = {
  key: "zoho_crm-find-or-create-record",
  name: "Find or Create Record",
  description:
    "Attempts to find a record on a module, if not found a new record is optionally created.",
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
      ],
      default: "Leads",
    },
    record: {
      type: "object",
      label: "Record",
      description:
        "The record you'd like to find. If not found, a new record optionally could be created with the data provided. Depending on the selected module, certain fields must be presented in the record being created. I.e. for Leads `Last_Name` is required, see more at Zoho CRM [Insert Records](https://www.zoho.com/crm/developer/docs/api/v2.1/insert-records.html) API docs.",
      optional: true,
    },
    fields: {
      type: "string",
      label: "Fields",
      description:
        "Comma separated list of the fields you'd like to retrieve in the records matching your search, or from the newly created record, if no records are found and `createRecord` prop is set to `true`.",
      optional: true,
    },
    createRecord: {
      type: "boolean",
      label: "Create New Record?",
      description:
        "When true, a new record will be created if no record is found.",
      default: false,
    },
  },
  methods: {
    ...common.methods,
  },
  /*
  This methods runs the logic for the `Find or Create Record".
  The following algorithim is perfomed:
  1. Validation against the props of the actions.
  2. If validation passed, `criteria` prop is used to find records.
  3. If records are found, the results are turned.
  4. If records are not found, the `createRecord` prop flag is checked
  5. If `createRecord` is on `record` is validated module-wise.
  5.a If `createRecord` is off, the flow finishes.
  6. If module-wise validation passed, a `record` is used to create a new record.
* @returns { searchSuccess: boolean, hasNewRecord: boolean, searchResults: array, newRecord: object }
  searchSuccess -- Indicates if results were found.
  hasNewRecord  -- Indicates if a new record was created.
  searchResults -- Contains records found, if any.
  newRecord     -- The new record data. This is populated when no record was found, `createRecord` flag is on, and the record was created succesfully.
  */
  async run() {
    const constraints = {
      domainLocation: {
        presence: true,
      },
      module: {
        presence: true,
      },
      record: {
        presence: this.createRecord,
      },
    };
    let validationResult = validate(
      {
        domainLocation: this.domainLocation,
        module: this.module,
        record: this.record,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    const searchResultsGenerator = await this.zoho_crm.searchRecords(
      this.domainLocation,
      this.module,
      this.criteria,
      null,
      null,
      null,
      this.fields
    );
    const searchResults = await this.getGeneratorResults(
      searchResultsGenerator
    );
    if (searchResults.length) {
      return {
        searchSuccess: true,
        hasNewRecord: false,
        searchResults,
        newRecord: null,
      };
    } else if (this.createRecord) {
      let moduleConstraints;
      let moduleFieldsValues;
      switch (this.module) {
        case "Leads":
        case "Contacts":
          {
            moduleConstraints = {
              Last_Name: {
                presence: true,
              },
            };
            moduleFieldsValues = { Last_Name: this.record.Last_Name };
          }
          break;
        case "Accounts":
          {
            moduleConstraints = {
              Account_Name: {
                presence: true,
              },
            };
            moduleFieldsValues = { Account_Name: this.record.Account_Name };
          }
          break;
        case "Deals":
          {
            moduleConstraints = {
              Deal_Name: {
                presence: true,
              },
              Stage: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Deal_Name: this.record.Deal_Name,
              Stage: this.record.Stage,
            };
          }
          break;
        case "Tasks":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
            };
            moduleFieldsValues = { Subject: this.record.Subject };
          }
          break;
        case "Calls":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
              Call_Type: {
                presence: true,
              },
              Call_Start_Time: {
                presence: true,
              },
              Call_Duration: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Subject: this.record.Subject,
              Call_Type: this.record.Call_Type,
              Call_Start_Time: this.record.Call_Start_Time,
              Call_Duration: this.record.Call_Duration,
            };
          }
          break;
        case "Events":
          {
            moduleConstraints = {
              Event_Title: {
                presence: true,
              },
              Call_Type: {
                presence: true,
              },
              Start_DateTime: {
                presence: true,
              },
              End_DateTime: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Event_Title: this.record.Event_Title,
              Call_Type: this.record.Call_Type,
              Start_DateTime: this.record.Start_DateTime,
              End_DateTime: this.record.End_DateTime,
            };
          }
          break;
        case "Products":
          {
            moduleConstraints = {
              Product_Name: {
                presence: true,
              },
            };
            moduleFieldsValues = { Product_Name: this.record.Product_Name };
          }
          break;
        case "Quotes":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
              Quoted_Items: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Subject: this.record.Subject,
              Quoted_Items: this.record.Quoted_Items,
            };
          }
          break;
        case "Invoices":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
              Invoiced_Items: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Subject: this.record.Subject,
              Invoiced_Items: this.record.Invoiced_Items,
            };
          }
          break;
        case "Campaigns":
          {
            moduleConstraints = {
              Campaign_Name: {
                presence: true,
              },
            };
            moduleFieldsValues = { Campaign_Name: this.record.Campaign_Name };
          }
          break;
        case "Vendors":
          {
            moduleConstraints = {
              Vendor_Name: {
                presence: true,
              },
            };
            moduleFieldsValues = { Vendor_Name: this.record.Vendor_Name };
          }
          break;
        case "Price_Books":
          {
            moduleConstraints = {
              Price_Book_Name: {
                presence: true,
              },
              Pricing_Details: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Price_Book_Name: this.record.Price_Book_Name,
              Pricing_Details: this.record.Pricing_Details,
            };
          }
          break;
        case "Cases":
          {
            moduleConstraints = {
              Case_Origin: {
                presence: true,
              },
              Status: {
                presence: true,
              },
              Subject: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Case_Origin: this.record.Case_Origin,
              Status: this.record.Status,
              Subject: this.record.Subject,
            };
          }
          break;
        case "Solutions":
          {
            moduleConstraints = {
              Solution_Title: {
                presence: true,
              },
            };
            moduleFieldsValues = { Solution_Title: this.record.Solution_Title };
          }
          break;
        case "Purchase_Orders":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
              Vendor_Name: {
                presence: true,
              },
              Purchased_Items: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Subject: this.record.Subject,
              Vendor_Name: this.record.Vendor_Name,
              Purchased_Items: this.record.Purchased_Items,
            };
          }
          break;
        case "Sales_Orders":
          {
            moduleConstraints = {
              Subject: {
                presence: true,
              },
              Ordered_Items: {
                presence: true,
              },
            };
            moduleFieldsValues = {
              Subject: this.record.Subject,
              Ordered_Items: this.record.Ordered_Items,
            };
          }
          break;
      }
      validate.validators.presence.message = `is required for creating records in the ${this.module} module.`;
      validationResult = validate(moduleFieldsValues, moduleConstraints);
      if (validationResult) {
        const validationMessages = this.getValidationMessage(validationResult);
        throw new Error(validationMessages);
      }
      const createRecordResult = await this.zoho_crm.createModuleRecord(
        this.domainLocation,
        this.module,
        { data: [this.record] }
      );
      const createRecordResultData = get(createRecordResult, ["data"]);
      if (createRecordResultData.length) {
        if (["SUCCESS"].includes(createRecordResultData[0].code)) {
          const createdRecordGenerator = this.zoho_crm.searchRecords(
            this.domainLocation,
            this.module,
            `id:equals:${createRecordResultData[0].details.id}`,
            null,
            null,
            null,
            this.fields
          );
          const createdRecord = await createdRecordGenerator.next();
          return {
            searchSuccess: false,
            hasNewRecord: true,
            searchResults: null,
            newRecord: createdRecord.value,
          };
        }
      } else {
        return {
          searchSuccess: false,
          hasNewRecord: false,
          searchResults: null,
          newRecord: null,
        };
      }
    } else {
      return {
        searchSuccess: false,
        hasNewRecord: false,
        searchResults: null,
        newRecord: null,
      };
    }
  },
};
