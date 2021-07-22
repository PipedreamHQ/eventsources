const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-create-contact-list",
  name: "Create Contact List",
  description: "Allows you to create a new contact list.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    name: {
      type: "string",
      label: "Name",
      description: "Your name for your list. maxLength: 100",
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      name: {
        presence: true,
        length: {
          maximum: 100,
        },
      },
    };
    const validationResult = validate({
      name: this.name,
    }, constraints);
    this.checkValidationResults(validationResult);
    return await this.sendgrid.createContactList(this.name);
  },
};
