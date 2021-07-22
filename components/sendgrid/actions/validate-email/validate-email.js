const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-validate-email",
  name: "Validate Email",
  description:
    "Validates an email address. This action requires a Sendgrid's Pro or Premier plan.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    email: {
      type: "string",
      label: "Email",
      description: "The email that you want to validate.",
    },
    source: {
      type: "string",
      label: "Source",
      description:
        "An optional indicator of the email address's source. You may include this if you are capturing email addresses from multiple locations.",
      optional: true,
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
    const validationResult = validate(
      {
        email: this.email,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    const config = {
      email: this.email,
    };
    if (this.source) {
      config.source = this.source;
    }
    return await this.sendgrid.validateEmail(config);
  },
};
