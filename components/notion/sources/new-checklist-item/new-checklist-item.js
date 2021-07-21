const common = require("../common");
const { notion } = common.props;
const get = require("lodash/get");

module.exports = {
  key: "notion-new-checklist-item",
  name: "New Checklist Item",
  description:
    "Emits an event when a new checklist item is added to a database or page.",
  version: "0.0.1",
  dedupe: "unique",
  type: "action",
  props: {
    ...common.props,
    notion,
    parent: {
      type: "string",
      label: "Database Or Page",
      description:
        "The database or page object you'd like to watch for new checklist items.",
      async options() {
        const options = [];
        const notionItems = [];
        const notionDatabases = await this.notion.getNotionItems("database");
        const notionPages = await this.notion.getNotionItems("page");
        notionDatabases.forEach((notionDatabase) =>
          notionItems.push(notionDatabase)
        );
        notionPages.forEach((notionPage) => notionItems.push(notionPage));

        for (const notionItem of notionItems) {
          //Populating options with Notion databases
          if (["database"].includes(notionItem.object)) {
            const notionDatabaseTitle = get(notionItem, ["title", "length"]);
            if (notionDatabaseTitle) {
              options.push({
                label: `(DATABASE) ${notionItem.title[0].text.content}`,
                value: notionItem.id,
              });
            }
          } else {
            //Populating options with Notion pages
            if (["page"].includes(notionItem.object)) {
              const notionPageTitle = get(notionItem, [
                "properties",
                "Name",
                "title",
                "length",
              ]);
              if (notionPageTitle) {
                options.push({
                  label: `(PAGE) ${notionItem.properties.Name.title[0].text.content}`,
                  value: notionItem.id,
                });
              }
            }
          }
        }
        return options;
      },
    },
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      let notionBlocks;
      let sampleEmmitted = false;
      const checklistBlocks = [];
      do {
        notionBlocks = await this.notion.getBlockChildren(
          this.parent,
          this.db.get("startCursor"),
          100
        );
        const hasPageResults = get(notionBlocks, ["results", "length"]);
        if (!hasPageResults) {
          console.log("No data available, skipping iteration");
          break;
        }
        notionBlocks.results.forEach((notionBlock) => {
          if (["to_do"].includes(notionBlock.type)) {
            checklistBlocks.push(notionBlock);
          }
        });
        if(!sampleEmmitted && checklistBlocks.length >= 10){
          checklistBlocks.slice(0, 10).forEach(this.emitNotionEvent);
          sampleEmmitted = true;
        }
        if (notionBlocks.next_cursor) {
          this.db.set("startCursor", notionBlocks.next_cursor);
        }
      } while (notionBlocks.has_more);
    },
  },
  methods: {
    ...common.methods,
    generateEventMetadata(notionEvent) {
      return {
        id: notionEvent.id,
        summary: "New checklist item created.",
        ts: notionEvent.created_time,
      };
    },
  },
  async run() {
    let notionBlocks;
    const checklistBlocks = [];
    do {
      notionBlocks = await this.notion.getBlockChildren(
        this.parent,
        this.db.get("startCursor"),
        100
      );
      const hasPageResults = get(notionBlocks, ["results", "length"]);
      if (!hasPageResults) {
        console.log("No data available, skipping iteration");
        break;
      }

      notionBlocks.results.forEach((notionBlock) => {
        if (["to_do"].includes(notionBlock.type)) {
          checklistBlocks.push(notionBlock);
        }
      });
      if (notionBlocks.next_cursor) {
        this.db.set("startCursor", notionBlocks.next_cursor);
      }
    } while (notionBlocks.has_more);
    checklistBlocks.forEach(this.emitNotionEvent);
  },
};
