const axios = require("axios");
const get = require("lodash/get");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "notion",
  methods: {
    _authToken() {
      return this.$auth.oauth_access_token;
    },
    _apiUrl() {
      return "https://api.notion.com";
    },
    async _makeRequest(opts) {
      if (!opts.headers) opts.headers = {};
      opts.headers.authorization = `Bearer ${this._authToken()}`;
      opts.headers["user-agent"] = "@PipedreamHQ/pipedream v0.1";
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Notion-Version"] = "2021-05-13";
      const { path } = opts;
      delete opts.path;
      opts.url = `${this._apiUrl()}${path[0] === "/" ? "" : "/"}${path}`;
      return (await axios(opts)).data;
    },
    _isRetriableStatusCode(statusCode) {
      [408, 429, 500].includes(statusCode);
    },
    async _withRetries(apiCall) {
      const retryOpts = {
        retries: 3,
        factor: 2,
      };
      return retry(async (bail) => {
        try {
          return await apiCall();
        } catch (err) {
          const statusCode = [get(err, ["response", "status"])];
          if (!this._isRetriableStatusCode(statusCode)) {
            bail(`
              Unexpected error (status code: ${statusCode}):
              ${JSON.stringify(err.message)}
            `);
          }
          console.warn(`Temporary error: ${err.message}`);
          throw err;
        }
      }, retryOpts);
    },
    /**
     * Adds a new page to the specified parent object, a database or an existing page.
     * @params {object} parent - The new page [database parent](https://developers.notion.com/reference/page#database-parent) or [page parent](https://developers.notion.com/reference/page#page-parent).
     * @params {object} properties - An object with property values of the page being added. The keys are the names or IDs of the [property](https://developers.notion.com/reference-link/database-property) and the values are [property values](https://developers.notion.com/reference-link/page-property-value).
     * @params {object} children - The content of the new page, in form of [block objects](https://developers.notion.com/reference-link/block).
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } An object specifing the Notion object type, "page" in this case, an `id` with the identifier of the page, the page's `created_time`  and `last_edited_time` dates, the flag `archived` indicating if the pages has been archived, the `properties` object, which contains all the properties of the page and their values.
     */
    async addPage(parent, properties, children) {
      const data = {
        parent,
        properties,
      };
      if (children) {
        data.children = children;
      }
      return await this._withRetries(() =>
        this._makeRequest({
          method: "POST",
          path: `/v1/pages`,
          data,
        })
      );
    },
    /**
     * Adds content to a specified page or block. In Notion, content is added via [blocks](https://developers.notion.com/reference/block), which can be headings, paragraphs, lists, to dos, etc.
     * @params {String} blockId - The unique identifier of the page or block to add content to.
     * @params {object} children - The content to be added, in form of block objects.
     * @returns { object: string,  id: string, created_time: date, last_edited_time: date, string, has_children: boolean,} `object` for the Notion object type of the result, in this case `block` for all block types, an `id` with the identifier of the block, the blocks' `created_time` and `last_edited_time` dates, the `has_children` to indicate whether or not the block has children blocks nested within it. The results may contain more object, depending on the block object.
     */
    async addContentToPageOrBlock(blockId, children) {
      return await this._withRetries(() =>
        this._makeRequest({
          method: "PATCH",
          path: `/v1/blocks/${blockId}/children`,
          data: {
            children,
          },
        })
      );
    },
    /**
     * Gets details for all users in the connected Notion account workspace.
     * @params {string} startCursor - Points to the start page of results. If not supplied, this the first page of results will be returned.
     * @params {string} pageSize - Specifies the number of items on each page in the results.
     * @returns {has_more: boolean, next_cursor: string, object: string, results: array} The `has_more` flag, which indicates that there are more page results available, "next_cursor" a cursor pointing to the next result page, `object` for the Notion object type of the result, in this case `list`, a `results` array with the users in the current results page.
     */

    async getAllUsers(startCursor, pageSize) {
      let params = {};
      if (startCursor) {
        params.start_cursor = startCursor;
      }
      if (pageSize) {
        params.page_size = pageSize;
      }
      return await this._withRetries(() =>
        this._makeRequest({
          path: `/v1/users`,
          params,
        })
      );
    },
    /**
     * Gets a list of child block objects contained in a block.
     * @params {String} blockId - The unique identifier of the block to get children blocks.
     * @params {string} startCursor - Points to the start page of results. If not supplied, this the first page of results will be returned.
     * @params {string} pageSize - Specifies the number of items on each page in the results
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } The database's `created_time` and `last_edited_time` dates, an `id` with the identifier of the database, `object` for the Notion object type of the result, in this case `database`, the `properties` object, which contains all the properties (or columns) of the database and their definition, and the `title` object with the title of the databse and other title attributes.
     */
    async getBlockChildren(blockId, startCursor, pageSize) {
      let params = {};
      if (startCursor) {
        params.start_cursor = startCursor;
      }
      if (pageSize) {
        params.page_size = pageSize;
      }
      return await this._withRetries(() =>
        this._makeRequest({
          path: `/v1/blocks/${blockId}/children`,
          params,
        })
      );
    },
    /**
     * Gets details of an specified database.
     * @params {String} databaseId - The unique identifier of the database to get details.
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } The database's `created_time` and `last_edited_time` dates, an `id` with the identifier of the database, `object` for the Notion object type of the result, in this case `database`, the `properties` object, which contains all the properties (or columns) of the database and their definition, and the `title` object with the title of the databse and other title attributes.
     */
    async getDatabase(databaseId) {
      return await this._withRetries(() =>
        this._makeRequest({
          path: `/v1/databases/${databaseId}`,
        })
      );
    },
    /**
     * Gets all the items of the specified type.
     * @params {String} itemType - The type of items to get. Valid values: `database`, `page`.
     * @returns {object: string, results: array } The Notion object type of the results, in this case `list`, and the `results` as an array of objects, which will be of the specified `itemType`.
     */
    async getNotionItems(itemType) {
      const filter = { property: "object", value: itemType };
      let startCursor = null;
      const notionItems = [];
      let notionItemsPage;
      do {
        notionItemsPage = await this.searchItems(
          null,
          null,
          filter,
          startCursor,
          100
        );
        const hasDatabaseResults = get(notionItemsPage, ["results", "length"]);
        if (!hasDatabaseResults) {
          break;
        }
        notionItemsPage.results.forEach((result) => notionItems.push(result));
        if (notionItemsPage.next_cursor) {
          startCursor = notionItemsPage.next_cursor;
        }
      } while (notionItemsPage.has_more);
      return notionItems;
    },
    /**
     * Gets details of an specified page.
     * @params {String} pageId - The unique identifier of the page to get details.
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } The flag `archived` indicating if the page has been archived, the page's `created_time` and `last_edited_time` dates, an `id` with the identifier of the user, `object` for the Notion object type of the result, in this case `page`, `parent` for the parent object of the page, i.e. a database, or another page. The `properties` object, which contains all the properties of the page and their values.
     */
    async getPage(pageId) {
      return await this._withRetries(() =>
        this._makeRequest({
          path: `/v1/pages/${pageId}`,
        })
      );
    },
    /**
     * Gets details of an specified user in the connected Notion account workspace.
     * @params {String} userId - The unique identifier of the user to get details.
     * @returns {avatar_url: string,  id: string, name: string, object: string, person: object , type: string} An url pointing to the user's avatar in `avatar_url`, the unique identifier (`id`) of the user, the user's `name`, the Notion object type, "user" in this case. A `person` object with the email address fof the user, and the Notion user `type, i.e. person or bot.
     */
    async getUser(userId) {
      return await this._withRetries(() =>
        this._makeRequest({
          path: `/v1/users/${userId}`,
        })
      );
    },
    /**
     * Gets a list of pages contained in the specified database, according to filter conditions.
     * @params {String} databaseId - The unique identifier of the database to query for pages.
     * @params {object} filter - An object with the [filter conditions](https://developers.notion.com/reference-link/post-database-query-filter) which if provided will limit the pages included in the results.
     * @params {object} sorts - An object with the [sort criteria](https://developers.notion.com/reference-link/post-database-query-sort) used to order the pages included in the results. Example `[{"property":"Last ordered","direction":"ascending"}]
     * @params {string} startCursor - Points to the start page of results. If not supplied, this the first page of results will be returned.
     * @params {string} pageSize - Specifies the number of items on each page in the results.
     * @returns {has_more: boolean, next_cursor: string, object: string, results: array} The `has_more` flag, which indicates that there are more page results available, "next_cursor" a cursor pointing to the next result page, `object` for the Notion object type of the result, in this case `list`, a `results` array with the pages matched by the filter conditions.
     */
    async queryDatabasePages(databaseId, filter, sorts, startCursor, pageSize) {
      const data = {};
      if (filter) {
        data.filter = filter;
      }
      if (sorts) {
        data.sorts = sorts;
      }
      if (startCursor) {
        data.start_cursor = startCursor;
      }
      if (pageSize) {
        data.page_size = pageSize;
      }
      return await this._withRetries(() =>
        this._makeRequest({
          method: "POST",
          path: `v1/databases/${databaseId}/query`,
          data,
        })
      );
    },
    /**
     * Updates the properties of the specified page.
     * @params {String} pageId - The unique identifier of the page to update properties on.
     * @params {object} properties - An object with property values to update for this page. The object keys are the names or IDs of the [property](https://developers.notion.com/reference-link/database-property) and the values are [property values](https://developers.notion.com/reference-link/page-property-value). Example `{\"In stock\":{\"checkbox\":true}}`.
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } An object specifying the Notion object type, "page" in this case, an `id` with the identifier of the page, the page's `created_time` and `last_edited_time` dates, the flag `archived` indicating if the pages has been archived, the `properties` object, which contains all the properties of the page and their values.
     */
    async searchItems(query, sort, filter, startCursor, pageSize) {
      const data = {};
      if (query) {
        data.query = query;
      }
      if (sort) {
        data.sort = sort;
      }
      if (filter) {
        data.filter = filter;
      }
      if (startCursor) {
        data.start_cursor = startCursor;
      }
      if (pageSize) {
        data.page_size = pageSize;
      }
      return await this._withRetries(() =>
        this._makeRequest({
          method: "POST",
          path: `v1/search`,
          data,
        })
      );
    },
    /**
     * Updates the properties of the specified page.
     * @params {String} pageId - The server prefix used to access the connected Maichimp account.
     * @params {object} properties - An object with property values to update for this page. The object keys are the names or IDs of the [property](https://developers.notion.com/reference-link/database-property) and the values are [property values](https://developers.notion.com/reference-link/page-property-value). Example `{\"In stock\":{\"checkbox\":true}}`.
     * @returns {object: string, id: string, created_time: Date, last_edited_time: Date, archived:  boolean, properties: object } An object specifing the Notion object type, "page" in this case, an `id` with the identifier of the page, the page's `created_time`  and `last_edited_time` dates, the flag `archived` indicating if the pages has been archived, the `properties` object, which contains all the properties of the page and their values.
     */
    async updatePageProperties(pageId, properties) {
      return await this._withRetries(() =>
        this._makeRequest({
          method: "PATCH",
          path: `/v1/pages/${pageId}`,
          data: {
            properties,
          },
        })
      );
    },
  },
};
