const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-get-a-global-supression",
  name: "Get A Global Supression",
  description: "Gets a global supression.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    email: {
      type: "string",
      label: "Email",
      description:
        "The email address of the global suppression you want to retrieve.",
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
    return await this.sendgrid.getGlobalSupression(this.email);
  },
};
