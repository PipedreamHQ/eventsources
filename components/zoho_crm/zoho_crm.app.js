const axios = require("axios");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "zoho_crm",
  methods: {
    _authToken() {
      return this.$auth.oauth_access_token;
    },
    _apiUrl() {
      return "https://www.zohoapis.com/crm/v2";
    },
    _isRetriableStatusCode(statusCode) {
      [408, 429, 500].includes(statusCode);
    },
    _leadsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/Leads`;
    },
    _metadataUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/settings/modules`;
    },
    _usersUrl(id) {
      const baseUrl = this._apiUrl();
      const basePath = `${baseUrl}/users`;
      return id ? `${basePath}/${id}` : basePath;
    },
    _watchActionsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/actions/watch`;
    },
    _makeRequestConfig() {
      const authToken = this._authToken();
      const headers = {
        Authorization: `Zoho-oauthtoken ${authToken}`,
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    async _withRetries(apiCall) {
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
              ${JSON.stringify(err.response, null, 2)}
            `);
          }
          console.warn(`Temporary error: ${err.message}`);
          throw err;
        }
      }, retryOpts);
    },
    async convertLead(recordId, body) {
      const url = `${this._leadsUrl()}/${recordId}/actions/convert`;
      const requestConfig = this._makeRequestConfig();
      const requestData = {};
      requestData.data = body;
      const { data } = await this._withRetries(() =>
        axios.post(url, requestData, requestConfig)
      );
      return data;
    },
    async genericApiGetCall(url, params = {}) {
      const baseRequestConfig = this._makeRequestConfig();
      const requestConfig = {
        ...baseRequestConfig,
        params,
      };
      const { data } = await axios.get(url, requestConfig);
      return data;
    },
    usersPageSize() {
      return 200;
    },
    /**
     * This function computes and returns the page number of the users API that
     * would contain new user records, based on the amount of records processed
     * so far, and the users API page size.
     *
     * This is useful when scanning the users API (which returns an append-only
     * list of records) since it allows to skip those pages that contain records
     * that were already seen/processed.
     *
     * @param {object} opts The input parameters for this function
     * @param {number} opts.userCount The amount of users/records by which to
     * offset the page number. Defaults to 0.
     * @param {number} opts.pageSize The size of the users API page. Defaults to
     * 200.
     * @returns The users API page number where new records would be contained
     */
    computeLastUsersPage({ userCount = 0, pageSize = this.usersPageSize() }) {
      return 1 + Math.floor(userCount / pageSize);
    },
    /**
     * This function computes and returns the number of records at the beginning
     * of the users page that were already processed. The computation is based
     * on the total amount of user records processed, as well as the page size
     * of the users API.
     *
     * This is useful when scanning the users API (which returns an append-only
     * list of records) since it allows to skip those records that were already
     * seen/processed.
     *
     * @param {object} opts The input parameters for this function
     * @param {number} opts.userCount The amount of users/records by which to
     * offset the page number. Defaults to 0.
     * @param {number} opts.pageSize The size of the users API page. Defaults to
     * 200.
     * @returns The number of records at the beginning of the users page that
     * were already processed and can be skipped
     */
    computeUsersOffset({ userCount = 0, pageSize = this.usersPageSize() }) {
      return userCount % pageSize;
    },
    async getUserCount({ type }) {
      const url = this._usersUrl();
      const pageSize = this.usersPageSize();
      const params = {
        page_size: pageSize,
        type,
      };
      const {
        info: { count: userCount },
      } = await this.genericApiGetCall(url, params);
      return userCount;
    },
    async *getUsers({ page = 1, type }) {
      const url = this._usersUrl();
      let moreRecords = false;
      let params = {
        page,
        type,
      };
      do {
        const { users, info } = await this.genericApiGetCall(url, params);
        for (const user of users) {
          yield user;
        }

        moreRecords = !!info.moreRecords;
        params = {
          ...params,
          page: page + 1,
        };
      } while (moreRecords);
    },
    async listModules() {
      const url = this._metadataUrl();
      const requestConfig = this._makeRequestConfig();
      const { data } = await axios.get(url, requestConfig);
      return data;
    },
    async createHook(opts) {
      const { token, notifyUrl, channelId, channelExpiry, events } = opts;

      const url = this._watchActionsUrl();
      const requestConfig = this._makeRequestConfig();

      // A description of each parameter can be found in the developer docs:
      // https://www.zoho.com/crm/developer/docs/api/v2/notifications/enable.html
      const requestData = {
        watch: [
          {
            token,
            notify_url: notifyUrl,
            channel_id: channelId,
            channel_expiry: channelExpiry,
            events,
          },
        ],
      };

      const { data } = await axios.post(url, requestData, requestConfig);
      return data;
    },
    async deleteHook(channelId) {
      const url = this._watchActionsUrl();

      // `channel_ids` is a comma-separated list of channel ID's, so we convert
      // `channelId` (a number) to a string. See the docs for more information:
      // https://www.zoho.com/crm/developer/docs/api/v2/notifications/disable.html
      const params = {
        channel_ids: `${channelId}`,
      };
      const requestConfig = {
        ...this._makeRequestConfig(),
        params,
      };
      await axios.delete(url, requestConfig);
    },
    async renewHookSubscription(opts) {
      const { channelId, channelExpiry, events, token } = opts;
      const url = this._watchActionsUrl();
      const requestConfig = this._makeRequestConfig();

      // A description of each parameter can be found in the developer docs:
      // https://www.zoho.com/crm/developer/docs/api/v2/notifications/update-info.html
      const requestData = {
        watch: [
          {
            channel_id: channelId,
            channel_expiry: channelExpiry,

            // The events array must always be provided, even if it's not being
            // changed.
            events,

            // The token must always be provided, even if it's not being
            // changed. Otherwise it will be set to `null`.
            token,
          },
        ],
      };

      const { data } = await axios.patch(url, requestData, requestConfig);
      return data;
    },
  },
};
