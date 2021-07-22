const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-list-blocks",
  name: "List Blocks",
  description:
    "Allows you to list all email addresses that are currently on your blocks list.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    startTime: {
      type: "integer",
      label: "Start Time",
      description:
        "The start of the time range when a blocked email was created (inclusive). This is a unix timestamp.",
      optional: true,
    },
    endTime: {
      type: "integer",
      label: "End Time",
      description:
        "The end of the time range when a blocked email was created (inclusive). This is a unix timestamp.",
      optional: true,
    },
    numberOfBlocks: {
      type: "integer",
      label: "Max # of Blocks to Return",
      description: "Indicates the max number of blocked emails to return.",
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      numberOfBlocks: {
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
        numberOfBlocks: this.numberOfBlocks,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    this.integerValueGreaterThan(this.startTime, 0, "startTime", "0");
    this.integerValueGreaterThan(this.endTime, 0, "endTime", "0");
    this.integerValueGreaterThan(this.numberOfBlocks, 0, "numberOfBlocks", "0");
    this.integerValueGreaterThan(
      this.endTime,
      this.startTime,
      "endTime",
      "startTime",
    );
    const blocksGenerator = await this.sendgrid.listBlocks(
      this.startTime,
      this.endTime,
      this.numberOfBlocks,
    );
    const blocks = [];
    let block;
    do {
      block = await blocksGenerator.next();
      if (block.value) {
        blocks.push(block.value);
      }
    } while (!block.done);
    return blocks;
  },
};
