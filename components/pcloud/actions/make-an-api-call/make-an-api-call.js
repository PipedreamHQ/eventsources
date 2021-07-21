const pcloud = require("../../pcloud.app");
const validate = require("validate.js");

module.exports = {
  key: "pcloud-make-an-api-request",
  name: "Make An API Request",
  description: "Makes a aribitrary call to pCloud API.",
  version: "0.0.1",
  type: "action",
  props: {
    pcloud,
    requestMethod: {
      type: "string",
      label: "Request Method",
      description: "Http method to use in the request.",
      options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    relativeUrl: {
      type: "string",
      label: "Relative URL",
      description: "A path relative to pCloud API to send the request against.",
    },
    headers: {
      type: "object",
      label: "Headers",
      description:
        "Headers to send in the request. Authorization headers will already be included.",
      optional: true,
    },
    useFormData: {
      type: "boolean",
      label: "Use Form Data?",
      description:
        "When set to `true`, the body of the request sent against pCloud API will use a `multipart/form-data` content type. Otherwise `application/json` will be used.",
      default: true,
    },
    requestBody: {
      type: "object",
      label: "Request Body",
      description: "Body of the request.",
      optional: true,
    },
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
      { requestMethod: this.requestMethod, relativeUrl: this.relativeUrl },
      constraints
    );
    if (validationResult) {
      let validationResultKeys = Object.keys(validationResult);
      let validationMessages;
      if (validationResultKeys.length == 1) {
        validationMessages = validationResult[validationResultKeys[0]];
      } else {
        validationMessages =
          "Parameters validation failed with the following errors:\t";
        validationResultKeys.forEach(
          (validationResultKey) =>
            (validationMessages += `${validationResult[validationResultKey]}\t`)
        );
      }
      throw new Error(validationMessages);
    }
    return await this.pcloud.makeAnAPICall(
      this.requestMethod,
      this.relativeUrl,
      this.headers,
      this.requestBody,
      this.useFormData
    );
  },
};
