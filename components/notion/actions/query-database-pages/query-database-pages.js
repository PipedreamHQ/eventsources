const notion = require("../../notion.app");

module.exports = {
  key: "notion-query-database-pages",
  name: "Query Database Pages",
  description:
    "Gets a list of Pages contained in the specified database, according to filter conditions.",
  version: "0.0.5",
  type: "action",
  props: {
    notion,
    databaseId: {
      type: "string",
      label: "Database Id",
      description: "Unique identifier of a Notion database to query.",
      optional: true,
    },
    filter: {
      type: "object",
      label: "Filter",
      description:
        "The [filter conditions](https://developers.notion.com/reference-link/post-database-query-filter) which if provided will limit the pages included in the results.",
      optional: true,
    },
    sorts: {
      type: "string",
      label: "Sorts",
      description:
        'A JSON-based array of [sort criteria](https://developers.notion.com/reference-link/post-database-query-sort) used to order the pages included in the results. Example `[{"property":"Last ordered","direction":"ascending"}]`',
      optional: true,
    },
    startCursor: {
      type: "string",
      label: "Start Cursor",
      description:
        "This endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
      optional: true,
    },
    pageSize: {
      type: "integer",
      label: "Page Size",
      description:
        "The number of items from the full list desired in the response. Maximum: 100",
      min: 1,
      max: 100,
      optional: true,
    },
  },
  async run() {
    if (!this.databaseId) {
      throw new Error("Must provide databaseId parameters.");
    }
    const sorts = this.sorts ? JSON.parse(this.sorts) : null;
    return await this.notion.queryDatabasePages(
      this.databaseId,
      this.filter,
      sorts,
      this.startCursor,
      this.pageSize
    );
  },
};
