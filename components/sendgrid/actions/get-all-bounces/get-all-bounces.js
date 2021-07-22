const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-get-all-bounces",
  name: "Get All Bounces",
  description: "Allows you to get all of your bounces.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    startTime: {
      type: "integer",
      label: "Start Time",
      description:
        "Refers start of the time range in unix timestamp when a bounce was created (inclusive).",
      optional: true,
    },
    endTime: {
      type: "integer",
      label: "End Time",
      description:
        "Refers end of the time range in unix timestamp when a bounce was created (inclusive).",
      optional: true,
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {};
    if (this.startTime) {
      constraints.startTime = {
        type: "integer",
      };
    }
    if (this.endTime) {
      constraints.endTime = {
        type: "integer",
      };
    }
    const validationResult = validate(
      {
        startTime: this.startTime,
        endTime: this.endTime,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    this.integerValueGreaterThan(this.startTime, 0, "startTime", "0");
    this.integerValueGreaterThan(this.endTime, 0, "endTime", "0");
    this.integerValueGreaterThan(
      this.endTime,
      this.startTime,
      "endTime",
      "startTime",
    );
    return await this.sendgrid.getAllBounces(this.startTime, this.endTime);
  },
};
