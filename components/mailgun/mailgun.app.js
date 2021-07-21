const axios = require("axios");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const get = require("lodash/get");
const moment = require("moment");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "mailgun",
  propDefinitions: {
    domain: {
      type: "string",
      label: "Domain Name",
      async options({ page }) {
        const query = {
          limit: 50,
          skip: 50 * page,
        };
        const domains = await this.api("domains").list(query);
        return domains.map((domain) => domain.name);
      },
    },
    email: {
      type: "string",
      label: "Email Address",
    },
    haltOnError: {
      type: "boolean",
      label: "Halt on error?",
      default: true,
    },
    baseRegion: {
      type: "string",
      label: "Base region",
      description:
        'The region that Mailgun will use to send and receive email, which determines the URL to use when requesting Mailgun API. This must be the same region where "domain" was created.',
      default: "US",
      options: ["US", "EU"],
    },
    timer: {
      label: "Polling schedule",
      description: "Pipedream polls Reddit for events on this schedule.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15, // by default, run every 15 minutes.
      },
    },
  },
  methods: {
    api(api) {
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({
        username: "api",
        key: this.$auth.api_key,
        public_key: this.$auth.api_key,
      });
      return mg[api];
    },
    async suppress(domain, type, suppression) {
      const res = await axios({
        url: `https://api.mailgun.net/v3/${encodeURIComponent(
          domain
        )}/${encodeURIComponent(type)}`,
        method: "POST",
        auth: {
          username: "api",
          password: this.$auth.api_key,
        },
        headers: {
          "content-type": "application/json",
        },
        // eslint-disable-next-line multiline-ternary, array-bracket-newline
        data: JSON.stringify(
          Array.isArray(suppression) ? suppression : [suppression]
        ),
      });
      return res.data;
    },
    _mailgun(apiKey, domain, host) {
      return require("mailgun-js")({ apiKey, domain, host });
    },
    _apiKey() {
      return this.$auth.api_key;
    },
    _apiHost() {
      const subdomain = this.baseRegion == "EU" ? "api.eu" : "api";
      return `${subdomain}.mailgun.net`;
    },
    async _makeRequest(opts) {
      const { domain, method, path, params } = opts;
      const mailgun = this._mailgun(this._apiKey(), domain, this._apiHost());
      switch (method) {
        case "GET":
          return mailgun.get(path, params);
        case "POST":
          return mailgun.post(path, params);
        case "PUT":
          return mailgun.put(path, params);
        case "DELETE":
          return mailgun.delete(path, params);
        default:
          return;
      }
    },
    _isRetriableStatusCode(statusCode) {
      [402, 429, 500, 502, 503, 504].includes(statusCode);
      //More info on  Mailgun HTTP response codes: https://documentation.mailgun.com/en/latest/api-intro.html?highlight=502#status-codes
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
    /**
     * Get a list of domains under the connected Mailgun account.
     * @params {Integer} skip - Number of records to skip (0 by default).
     * @returns {total_count: integer, items: array} Object with the total count of domains in the Mailgun account, and the items array with the domain records. Records are queried in batches of 100 records each.
     */
    async getDomains(skip) {
      return await this._withRetries(() =>
        this._makeRequest({
          method: "GET",
          path: `/domains`,
          params: {
            skip,
          },
        })
      );
    },
    /**
     * Get details of an specific webhook in a given domain.
     * @params {String} mailgunDomain - Name of the Mailgun domain where the webhook is located.
     * @params {String} webhookName - Name of the webhook to get details of.
     * @returns {urls: array} Object with an array of the urls subscribed to the specified webhook.
     */
    async getWebhookDetails(mailgunDomain, webhookName) {
      const webhooks = await this._withRetries(() =>
        this._makeRequest({
          method: "GET",
          path: `/domains/${mailgunDomain}/webhooks`,
        })
      );
      return get(webhooks, `webhooks.${webhookName}`);
    },
    /**
     * Get a list with the entire set of domains under the connected Mailgun account.
     * @returns {Array} Array with the entire set of domains under the connected Mailgun account.
     */
    async getAllDomains() {
      let domains_set;
      const results = [];
      let skip = 0;
      do {
        domains_set = await this.getDomains(skip);
        domains_set.items.forEach((domain) => {
          results.push({
            name: domain.name,
          });
        });
        skip += domains_set.items.length || 0;
      } while (domains_set.items.length);
      return results;
    },
    /**
     * Creates a new webhook under a given domain.
     * @params {String} mailgunDomain - Name of the Mailgun domain where the webhook will be created under.
     * @params {String} webhookName - Name of the webhook to create. Must be one of the webhook names listed in the Mailgun API documentation, webhooks: [https://documentation.mailgun.com/en/latest/api-webhooks.html#webhooks]
     * @params {String} webhookUrl - URL listening for the webhook event. May be repeated up to 3 times.
     * @returns {message: string, webhook: { urls: Array }} An object with the result message of the request and a webhook object wrapping a one item array with the provided url of the webhook.
     */
    async createWebhook(mailgunDomain, webhookName, webhookUrl) {
      return await this._withRetries(() =>
        this._makeRequest({
          method: "POST",
          path: `/domains/${mailgunDomain}/webhooks`,
          params: {
            domain: mailgunDomain,
            url: webhookUrl,
            id: webhookName,
          },
        })
      );
    },
    /**
     * Updates a webhook existing under a given domain.
     * @params {String} mailgunDomain - Name of the Mailgun domain where the webhook to update is located.
     * @params {String} webhookName - Name of the webhook to update. Must be one of the webhook names listed in the Mailgun API documentation, webhooks: [https://documentation.mailgun.com/en/latest/api-webhooks.html#webhooks]
     * @params {String} webhookUrl - URL listening for the webhook event. May be repeated up to 3 times.
     * @returns {message: string, webhook: { urls: Array }} An object with the result message of the request and a webhook object wrapping an array with the updated urls of webhook.
     */
    async updateWebhook(mailgunDomain, webhookName, webhookUrls) {
      const opts = {
        method: "PUT",
        path: `/domains/${mailgunDomain}/webhooks/${webhookName}`,
        params: {
          domain: mailgunDomain,
          webhookname: webhookName,
          url: webhookUrls,
        },
      };
      return await this._withRetries(() => this._makeRequest(opts));
    },
    /**
     * Deletes a webhook under a given domain.
     * @params {String} mailgunDomain - Name of the Mailgun domain where the webhook to delete is located.
     * @params {String} webhookName - Name of the webhook to delete. Must be one of the webhook names listed in the Mailgun API documentation, webhooks: [https://documentation.mailgun.com/en/latest/api-webhooks.html#webhooks]
     * @returns {message: string, webhook: { urls: Array }} An object with the result message of the request and a webhook object wrapping an array with the urls that were related to the webhook.
     */
    async deleteWebhook(mailgunDomain, webhookName) {
      return await this._withRetries(() =>
        this._makeRequest({
          method: "DELETE",
          path: `/domains/${mailgunDomain}/webhooks/${webhookName}`,
        })
      );
    },
    /**
     * Get a list of Mailgun event under a given domain occured
     * @params {String} mailgunDomain - Name of the Mailgun domain where the events are located.
     * @params {String} [nextId = null] - The index of the next page with events to return.
     * @params {Integer} [limit = 300] - The max number of event entries to return on each page.
     * @returns {items: Array, paging: Object } An object with an array of event items, and a paging object to enable pagination over the events matched by the request query.
     */
    async getMailgunEvents(mailgunDomain, nextId = null, limit = 300) {
      const nextPathPart = nextId ? `/${nextId}` : "";
      const begin = moment().subtract(1, "days").unix();
      return await this._makeRequest({
        method: "GET",
        path: `/${mailgunDomain}/events${nextPathPart}`,
        params: {
          begin,
          ascending: "yes",
          limit,
        },
      });
    },
    /**
     * Get a list of mailing lists available under the connected Mailgun account
     * @params {String} page - Name of the Mailgun domain where the events are located.
     * @params {Integer} [limit = 100] - Max number of mailing list entries to return on each page.
     * @params {String} [address = null] - Email address of the last mailing list in the previous page.
     * @returns {items: Array, paging: Object } An object with an array of mailing list items, and a paging object to enable pagination over all available mailing lists.
     */
    async getMailgunLists(page, limit = 100, address = null) {
      let params = {
        page,
        limit,
      };
      if (address) {
        params["address"] = address;
      }
      return await this._makeRequest({
        method: "GET",
        path: "/lists/pages",
        params,
      });
    },
  },
};
