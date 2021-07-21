const common = require("../common");
const { notion } = common.props;
const get = require("lodash/get");

module.exports = {
  ...common,
  key: "notion-updated-page",
  name: "Updated Page",
  description: "Emits an event when a page is updated in a database.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    notion,
    databaseId: {
      type: "string",
      label: "Database Id",
      description: "Unique identifier of the database to watch for updated pages.",
    }
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      let notionPages;
      let sampleEmmitted = false;
      const sorts = [{ timestamp: "last_edited_time", direction: "ascending" }];
      do {
        notionPages = await this.notion.queryDatabasePages(
          this.databaseId,
          null,
          sorts,
          this.db.get("startCursor"),
          100
        );
        const hasPageResults = get(notionPages, ["results", "length"]);
        if (!hasPageResults) {
          console.log("No data available, skipping iteration");
          break;
        }
        if(!sampleEmmitted){
          notionPages.results.slice(0,10).forEach(this.emitNotionEvent);
          sampleEmmitted = true;
        }
        if (notionPages.next_cursor) {
          this.db.set("startCursor", notionPages.next_cursor);
        }
      } while (notionPages.has_more);
    },
  },
  methods: {
    ...common.methods,
    generateEventMetadata(notionEvent) {
      const numOfPageTitles = get(notionEvent, [
        "properties",
        "Name",
        "title",
        "length",
      ]);
      let pageName;
      if (numOfPageTitles) {
        pageName = notionEvent.properties.Name.title[0].plain_text;
      }
      const summary = pageName
        ? `Page "${pageName}" was updated`
        : "Page updated.";
      const timestamp = +new Date(notionEvent.last_edited_time);
      return {
        id: `${notionEvent.id}${timestamp}`,
        summary,
        ts: notionEvent.last_edited_time,
      };
    },
  },
  async run() {
    let notionPages;
    const sorts = [{ timestamp: "last_edited_time", direction: "ascending" }];
    do {
      notionPages = await this.notion.queryDatabasePages(
        this.databaseId,
        null,
        sorts,
        this.db.get("startCursor"),
        100
      );
      const hasPageResults = get(notionPages, ["results", "length"]);
      if (!hasPageResults) {
        console.log("No data available, skipping iteration");
        break;
      }
      notionPages.results.forEach(this.emitNotionEvent);
      if (notionPages.next_cursor) {
        this.db.set("startCursor", notionPages.next_cursor);
      }
    } while (notionPages.has_more);
  },
};
