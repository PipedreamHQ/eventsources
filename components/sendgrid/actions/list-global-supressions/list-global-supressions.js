const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-list-global-supressions",
  name: "List Global Supression",
  description:
    "Allows you to get a list of all email address that are globally suppressed.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    startTime: {
      type: "integer",
      label: "Start Time",
      description:
        "Refers start of the time range in unix timestamp when an unsubscribe email was created (inclusive).",
      optional: true,
    },
    endTime: {
      type: "integer",
      label: "End Time",
      description:
        "Refers end of the time range in unix timestamp when an unsubscribe email was created (inclusive).",
      optional: true,
    },
    numberOfSupressions: {
      type: "integer",
      label: "Max # of Global Supressions to Return",
      description: "Indicates the max number of global supressions to return.",
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      numberOfSupressions: {
        presence: true,
        type: "integer",
      },
    };
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
        numberOfSupressions: this.numberOfSupressions,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    this.integerValueGreaterThan(this.startTime, 0, "startTime", "0");
    this.integerValueGreaterThan(this.endTime, 0, "endTime", "0");
    this.integerValueGreaterThan(this.numberOfSupressions, 0, "numberOfSupressions", "0");
    this.integerValueGreaterThan(
      this.endTime,
      this.startTime,
      "endTime",
      "startTime",
    );
    const globalSupressionsGenerator =
      await this.sendgrid.listGlobalSupressions(
        this.startTime,
        this.endTime,
        this.numberOfSupressions,
      );
    const globalSupressions = [];
    let globalSupression;
    do {
      globalSupression = await globalSupressionsGenerator.next();
      if (globalSupression.value) {
        globalSupressions.push(globalSupression.value);
      }
    } while (!globalSupression.done);
    return globalSupressions;
  },
};
