const mailchimp = require("@mailchimp/mailchimp_marketing");
const get = require("lodash/get");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "mailchimp",
  propDefinitions: {
    server: {
      type: "string",
      label: "server",
      description:
        "The Mailchimp server of the connected account. Found when logging into the Mailchimp account and looking at the URL on a browser. E.g. for https://us19.admin.mailchimp.com/; the us19 part is the server prefix.",
    },
    timer: {
      label: "Polling schedule",
      description: "Pipedream polls Mailchimp for events on this schedule.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60, // by default, run every 15 minutes.
      },
    },
  },
  methods: {
    _authToken() {
      return this.$auth.oauth_access_token;
    },
    _mailchimp(server) {
      const mailchimp = require("@mailchimp/mailchimp_marketing");
      mailchimp.setConfig({
        accessToken: this._authToken(),
        server,
      });
      return mailchimp;
    },
    async _withRetries(apiCall, allow404 = false) {
      const retryOpts = {
        retries: 5,
        factor: 2,
      };
      return retry(async (bail) => {
        try {
          return await apiCall();
        } catch (err) {
          const statusCode = get(err, ["response", "status"]);
          if (!this._isRetriableStatusCode(statusCode)) {
            bail(`
              Unexpected error (status code: ${statusCode}):
              ${JSON.stringify(err.response)}
            `);
          }
          console.warn(`Temporary error: ${err.message}`);
          throw err;
        }
      }, retryOpts);
    },
    _statusIsSent(status) {
      return ["status"].includes(status);
    },
    /**
     * Create a webhook on the specified Audience List.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} listId - The unique ID that identifies the Audience List you would like to create a webhook on.
     * @params {String} webhookUrl - URL listening for the webhook event.
     * @returns {_links: array, events: object, id: string, list_id: string, sources: object, url: string} Object with array of links for the webhook manipulation through the Mailchimp API, an object with flags of the Mailchimp Marketing indicates the events being watched for, an unique ID of the webhoom, the unique ID which identifies the Audience List where the webhoook was created, a `sources` object indicating whether the sources for the event are an admin user, an audience subscriber, or via the API, the URL registered for the webhook event.
     */
    async createWebhook(server, listId, webhookUrl, events, sources) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.lists.createListWebhook(listId, {
          url: webhookUrl,
          events,
          sources,
        })
      );
    },
    /**
     * Deletes a webhook on the specified Audience List.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} listId - The unique ID that identifies the Audience List containing the webhook to delete.
     * @params {String} webhookId - The unique ID of the webhook you'd like to delete.
     * @returns {} - This method returns an empty object.
     */
    async deleteWebhook(server, listId, webhookId) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.lists.deleteListWebhook(listId, webhookId)
      );
    },
    /**
     * Gets the audience lists under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {Date} beforeDateCreated - Restrict response to audience lists created before the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} sinceDateCreated - Restrict response to audience lists created since the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @returns {lists: array, total_items: integer, constraints: object, _links: object } An array with the information of the audience `lists` returned, `total_items` with the total count of the audience list collection, `constraints` object with possible limitations when quering this endpoint, and `_links` array of links for audience list manipulation through the Mailchimp API.
     */
    async getMailchimpAudienceLists(
      server,
      count,
      offset,
      beforeDateCreated,
      sinceDateCreated
    ) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.lists.getAllLists({
          count,
          offset,
          beforeDateCreated,
          sinceDateCreated,
          sortField: "date_created",
          sortDir: "DESC",
        })
      );
    },
    /**
     * Gets the marketing campaigns under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {Date} beforeDate - Restrict response to marketing campaigns created or sent before the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} sinceDate - Restrict response to marketing campaigns created or sent since the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @returns {campaigns: array, total_items: integer, constraints: object, _links: object } An array with the information of the `campaigns` returned, `total_items` with the total count of the campaigns collection, `constraints` object with possible limitations when quering this endpoint, and `_links` array of links for campaigns manipulation through the Mailchimp API.
     */
    async getMailchimpCampaigns(
      server,
      count,
      offset,
      status,
      beforeDate,
      sinceDate
    ) {
      let opts = { count, offset, status, sortDir: "DESC" };
      if (this._statusIsSent(status)) {
        opts.beforeSendTime = beforeDate;
        opts.sinceSendTime = sinceDate;
        opts.sortField = "send_time";
      } else {
        opts.beforeCreateTime = beforeDate;
        opts.sinceCreateTime = sinceDate;
        opts.sortField = "create_time";
      }
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() => mailchimp.campaigns.list(opts));
    },
    /**
     * Gets the subscribers added to a given audience list segment or tag under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} listId - The unique ID that identifies the Audience List associated to the segment or tag to look for subscribers.
     * @params {String} segmentId - The unique ID that identifies the Audience List segment or tag to look for subscribers.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {Boolean} includeTransactional - Include transactional members in response.
     * @returns {members: array, total_items: integer, _links: object } An array with the information of the subscribers (`members`) returned, `total_items` with the total count of the subscribers collection, and `_links` array of links for segment or tag subscribers manipulation through the Mailchimp API.
     */
    async getSegmentMembersList(
      server,
      listId,
      segmentId,
      count,
      offset,
      includeTransactional
    ) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.lists.getSegmentMembersList(listId, segmentId, {
          count,
          offset,
          includeTransactional,
          includeUnsubscribed: false,
        })
      );
    },
    /**
     * Gets files in the File Manager under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {String} type - The file type for the File Manager file, can be "image" or "file". Don't specify for both types.
     * @params {Boolean} includeTransactional - Include transactional members in response.
     * @params {Date} beforeCreatedAt - Restrict response to files created before the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} sinceCreatedAt - Restrict response to files created since the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @returns {files: array, total_file_size: integer, total_items: integer, _links: object } An array with the information of the `files` returned, `total_file_size` with the total size of all File Manager files in bytes, `total_items` with the total count of the files collection, and `_links` array of links for file manipulation through the Mailchimp API.
     */
    async getAllFiles(
      server,
      count,
      offset,
      type = null,
      beforeCreatedAt,
      sinceCreatedAt
    ) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.fileManager.files({
          count,
          offset,
          type,
          beforeCreatedAt,
          sinceCreatedAt,
        })
      );
    },
    /**
     * Gets customers in an specified Ecommerce Store under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} storeId - The unique ID of the Ecommerce Store you'd like to get customers from.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @returns {store_id: string, customers: array, total_items: integer, _links: object } `store_id` with the unique ID of the Ecommerce Store being queried, an array with the information of the `customers` returned, `total_items` with the total count of the customers collection, and `_links` array of links for customer manipulation through the Mailchimp API.
     */
    async getAllStoreCustomers(server, storeId, count, offset) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.ecommerce.getAllStoreCustomers(storeId, {
          count,
          offset,
        })
      );
    },
    /**
     * Gets orders in an specified Ecommerce Store, or orders under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} storeId - The unique ID of the Ecommerce Store you'd like to get orders from.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {String} campaignId - Restrict results to orders with this specific campaignId value.
     * @params {String} outreachId - Restrict results to orders with a specific outreachId value.
     * @params {String} customerId - Restrict results to orders made by the specific customer with this unique ID.
     * @params {Boolean} hasOutreach - Restrict results to orders that have an outreach attached. For example, an email campaign or Facebook ad.
     * @returns {store_id: string, orders: array, total_items: integer, _links: object } `store_id` with the unique ID of the Ecommerce Store if specified (not present otherwise), an array with the information of the `orders` returned, `total_items` with the total count of the orders collection, and `_links` array of links for order manipulation through the Mailchimp API.
     */
    async getAllOrders(
      server,
      storeId = null,
      count,
      offset,
      campaignId,
      outreachId,
      customerId,
      hasOutreach
    ) {
      const opts = {
        count,
        offset,
        campaignId: campaignId === "" ? null:campaignId,
        outreachId: outreachId === "" ? null:outreachId,
        customerId: customerId === "" ? null:customerId,
        hasOutreach: ["Both"].includes(hasOutreach) ? null: hasOutreach,
      };
      const mailchimp = this._mailchimp(server);
      if (storeId === "") {
        return await this._withRetries(() =>
          mailchimp.ecommerce.getStoreOrders(storeId, opts)
        );
      }
      return await this._withRetries(() => mailchimp.ecommerce.orders(opts));
    },
    /**
     * Gets details of a given campaign under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} campaignId - The unique ID of the campaign you'd like to get details of.
     * @returns An object with all the details of a campaign.
     */
    async getMailchimpCampaignInfo(server, campaignId) {
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() => mailchimp.campaigns.get(campaignId));
    },
    /**
     * Gets files in the File Manager under the connected Mailchimp acccount.
     * @params {String} server - The server prefix used to access the connected Maichimp account.
     * @params {String} listId - The unique ID that identifies the Audience List you'd like to watch for new or updated segments.
     * @params {Integer} count - For pagination, the number of records to return on each page. Default value is 10. Maximum value is 1000.
     * @params {Integer} offset - For pagination, this the number of records from a collection to skip. Default value is 0.
     * @params {Date} beforeCreatedAt - Restrict response to files created before the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} sinceCreatedAt - Restrict response to files created since the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} beforeUpdatedAt - Restrict response to files updated before the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @params {Date} sinceUpdatedAt - Restrict response to files updated since the set date. Uses ISO 8601 time format: 2015-10-21T15:41:36+00:00.
     * @returns {files: array, total_file_size: integer, total_items: integer, _links: object } An array with the information of the `files` returned, `total_file_size` with the total size of all File Manager files in bytes, `total_items` with the total count of the files collection, and `_links` array of links for file manipulation through the Mailchimp API.
     */
    async getAudienceSegments(
      server,
      listId,
      count,
      offset,
      sinceCreatedAt,
      beforeCreatedAt,
      sinceUpdatedAt,
      beforeUpdatedAt
    ) {
      let opts = { count, offset };
      if (sinceCreatedAt && beforeCreatedAt) {
        opts.sinceCreatedAt = sinceCreatedAt;
        opts.beforeCreatedAt = beforeCreatedAt;
      } else {
        opts.sinceUpdatedAt = sinceUpdatedAt;
        opts.beforeUpdatedAt = beforeUpdatedAt;
      }
      const mailchimp = this._mailchimp(server);
      return await this._withRetries(() =>
        mailchimp.lists.listSegments(listId, opts)
      );
    },
  },
};
