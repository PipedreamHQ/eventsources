const firebase = require("../firebase_admin_sdk.app.js");

module.exports = {
  props: {
    firebase,
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15,
      },
    },
  },
  methods: {
    processEvent() {
      throw new Error("processEvent is not implemented");
    },
  },
  async run(event) {
    await this.firebase.initializeApp();
    await this.processEvent(event);
    this.firebase.deleteApp();
  },
};
