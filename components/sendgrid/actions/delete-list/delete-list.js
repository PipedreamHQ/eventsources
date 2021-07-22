const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-delete-list",
  name: "Delete List",
  description: "Allows you to delete a specific list.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    id: {
      type: "string",
      label: "Id",
      description: "Unique Id of the List to be deleted.",
    },
    deleteContacts: {
      type: "boolean",
      label: "Delete Contacts?",
      description:
        "Indicates that all contacts on the list are also to be deleted.",
      default: false,
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      id: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        id: this.id,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    this.deleteContacts = !!this.deleteContacts;
    return await this.sendgrid.deleteList(this.id, this.deleteContacts);
  },
};
