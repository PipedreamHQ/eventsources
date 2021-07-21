const notion = require("../notion.app");

module.exports = {
  props: {
    notion,
    db: "$.service.db",
    timer: {
      label: "Polling schedule",
      description: "Pipedream polls Notion for events on this schedule.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 3, // by default, run every 15 minutes.
      },
    },
  },
  methods: {
    emitNotionEvent(notionEvent) {
      const metadata = this.generateEventMetadata(notionEvent);
      this.$emit(notionEvent, metadata);
    },
  },
};
