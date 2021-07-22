const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-remove-a-contact-from-a-list",
  name: "Remove A Contact From A List",
  description: "Allows you to remove contacts from a given list.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    id: {
      type: "string",
      label: "Id",
      description:
        "Unique Id of the List where the contact to remove off is located.",
    },
    contactIds: {
      type: "object",
      label: "Contact Ids",
      description:
        "Array of contact ids to be removed off the list.",
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
      contactIds: {
        presence: true,
        type: "array",
      },
    };
    const validationResult = validate(
      {
        id: this.id,
        contactIds: this.contactIds,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    const contactIds = this.contactIds.join(",");
    return await this.sendgrid.removeContactFromList(this.id, contactIds);
  },
};
