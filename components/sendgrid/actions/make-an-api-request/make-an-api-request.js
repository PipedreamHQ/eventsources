const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-make-an-api-request",
  name: "Make An API Request",
  description: "Makes a aribitrary call to Sendgrid API.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    requestMethod: {
      type: "string",
      label: "Request Method",
      description: "Http method to use in the request.",
      options: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
      ],
    },
    relativeUrl: {
      type: "string",
      label: "Relative URL",
      description:
        "A path relative to Sendgrid API to send the request against.",
    },
    headers: {
      type: "object",
      label: "Headers",
      description:
        "Headers to send in the request. Authorization headers will already be included.",
      optional: true,
    },
    requestBody: {
      type: "object",
      label: "Request Body",
      description: "Body of the request.",
      optional: true,
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      requestMethod: {
        presence: true,
      },
      relativeUrl: {
        presence: true,
      },
    };
    const validationResult = validate(
      {
        requestMethod: this.requestMethod,
        relativeUrl: this.relativeUrl,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    return await this.sendgrid.makeAnAPICall(
      this.requestMethod,
      this.relativeUrl,
      this.headers,
      this.requestBody,
    );
  },
};
