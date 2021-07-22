const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-delete-contacts",
  name: "Delete Contacts",
  description: "Allows you to delete one or more contacts.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    deleteAllContacts: {
      type: "boolean",
      label: "Delete All Contacts?",
      description: "This parameter allows you to delete all of your contacts. This can not be used with the `Ids` parameter.",
      default: false,
    },
    ids: {
      type: "object",
      label: "Ids",
      description: "An array of contact IDs to delete.",
      optional: true,
    },
  },
  methods: {
    ...common,
  },
  async run() {
    if (this.deleteAllContacts && this.ids) {
      throw new Error(
        "Must provide only one of `deleteAllContacts` or `ids` parameters.",
      );
    }
    const constraints = {};
    let ids = undefined;
    if (this.ids) {
      constraints.ids = {
        type: "array",
      };
      const validationResult = validate(
        {
          id: this.id,
          contactIds: this.contactIds,
        },
        constraints,
      );
      this.checkValidationResults(validationResult);
      ids = this.ids.join(",");
    }
    const deleteAllContacts = (this.deleteAllContacts)
      ? "true"
      : "false";
    return await this.sendgrid.deleteContacts(deleteAllContacts, ids);
  },
};
