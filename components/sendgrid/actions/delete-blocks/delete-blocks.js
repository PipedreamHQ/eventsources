const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-delete-blocks",
  name: "Delete Blocks",
  description: "Allows you to delete all email addresses on your blocks list.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    deleteAll: {
      type: "boolean",
      label: "Delete All",
      description:
        "Indicates if you want to delete all blocked email addresses. This can not be used with the `emails` parameter.",
      default: false,
    },
    emails: {
      type: "object",
      label: "Emails",
      description:
        "An array of the specific blocked email addresses that you want to delete. This can not be used with the `deleteAll` parameter. Example: `[\"email1@example.com\",\"email2@example.com\"]`",
      optional: true,
    },
  },
  methods: {
    ...common,
  },
  async run() {
    if (this.emails) {
      const constraints = {
        emails: {
          type: "array",
        },
      };
      const validationResult = validate(
        {
          emails: this.emails,
        },
        constraints,
      );
      this.checkValidationResults(validationResult);
    }
    if (this.deleteAll && this.emails) {
      throw new Error(
        "Must provide only one of `deleteAll` or `emails` parameters.",
      );
    }
    const deleteAll = !!this.deleteAll;
    return await this.sendgrid.deleteBlocks(deleteAll, this.emails);
  },
};
