const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-delete-global-supression",
  name: "Delete Global Supression",
  description:
    "Allows you to remove an email address from the global suppressions group.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    email: {
      type: "string",
      label: "Email",
      description:
        "The email address you want to remove from the global suppressions group.",
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      email: {
        presence: true,
        email: true,
      },
    };
    const validationResult = validate({
      email: this.email,
    }, constraints);
    this.checkValidationResults(validationResult);
    return await this.sendgrid.deleteGlobalSupression(this.email);
  },
};
