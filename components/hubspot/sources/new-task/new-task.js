const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-task",
  name: "New Calendar Task",
  description: "Emits an event for each new task added.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(task) {
      const {
        id,
        name,
        eventType,
      } = task;
      return {
        id,
        summary: `${name} - ${eventType}`,
        ts: Date.now(),
      };
    },
  },
  async run() {
    const yearFromNow = new Date();
    yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

    const results = await this.hubspot.getCalendarTasks(yearFromNow.getTime());
    for (const task of results) {
      const meta = this.generateMeta(task);
      this.$emit(task, meta);
    }
  },
};
