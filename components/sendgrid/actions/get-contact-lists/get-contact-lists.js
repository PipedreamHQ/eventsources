const sendgrid = require("../../sendgrid.app");
const validate = require("validate.js");
const common = require("../common");

module.exports = {
  key: "sendgrid-get-contact-lists",
  name: "Get Contact Lists",
  description: "Allows you to get details of your contact lists.",
  version: "0.0.1",
  type: "action",
  props: {
    sendgrid,
    numberOfLists: {
      type: "integer",
      label: "Number of Lists",
      description: "The number of contact lists to return.",
    },
  },
  methods: {
    ...common,
  },
  async run() {
    const constraints = {
      numberOfLists: {
        presence: true,
        type: "integer",
      },
    };
    const validationResult = validate(
      {
        numberOfLists: this.numberOfLists,
      },
      constraints,
    );
    this.checkValidationResults(validationResult);
    this.integerValueGreaterThan(this.numberOfLists, 0, "numberOfLists", "0");
    const contactListGenerator = this.sendgrid.getAllContactLists(
      this.numberOfLists,
    );
    const contactLists = [];
    let contactList;
    do {
      contactList = await contactListGenerator.next();
      if (contactList.value) {
        contactLists.push(contactList.value);
      }
    } while (!contactList.done);
    return contactLists;
  },
};
