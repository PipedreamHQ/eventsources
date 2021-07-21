const mongodb = require("../mongodb.app.js");

module.exports = {
  props: {
    mongodb,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15,
      },
    },
  },
  methods: {
    processEvent() {
      throw new Error("processEvent not implemented");
    },
    generateMeta() {
      throw new Error("generateMeta not implemented");
    },
    emitEvent(item, ts) {
      const meta = this.generateMeta(item, ts);
      this.$emit(item, meta);
    },
  },
  async run(event) {
    const { timestamp } = event;
    const client = await this.mongodb.getClient();
    await this.processEvent(client, timestamp);
    await client.close();
  },
};
