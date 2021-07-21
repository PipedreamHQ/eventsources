const common = require("../common");
const { notion } = common.props;
const get = require("lodash/get");

module.exports = {
  ...common,
  key: "notion-new-user",
  name: "New User",
  description:
    "Emits an event when a user is added to the workspace of the connected Notion account.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    notion,
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const notionUsers = await this.notion.getAllUsers(null, 10);
      const hasPageResults = get(notionUsers, ["results", "length"]);
      if (!hasPageResults) {
        console.log("No data available, skipping iteration");
        return;
      }
      notionUsers.results.forEach(this.emitNotionEvent);
    },
  },
  methods: {
    ...common.methods,
    generateEventMetadata(notionEvent) {
      return {
        id: notionEvent.id,
        summary: `New user "${notionEvent.name}" was added.`,
        ts: +new Date(),
      };
    },
  },
  async run() {
    let notionUsers;
    do {
      notionUsers = await this.notion.getAllUsers(
        this.db.get("startCursor"),
        100
      );
      const hasPageResults = get(notionUsers, ["results", "length"]);
      if (!hasPageResults) {
        console.log("No data available, skipping iteration");
        break;
      }
      notionUsers.results.forEach(this.emitNotionEvent);
      if (notionUsers.next_cursor) {
        this.db.set("startCursor", notionUsers.next_cursor);
      }
    } while (notionUsers.has_more);
    this.db.set("startCursor", null);
  },
};
