const axios = require("axios");
const get = require("lodash/get");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "sendgrid",
  methods: {
    _authToken() {
      return this.$auth.api_key;
    },
    _apiUrl() {
      return "https://api.sendgrid.com/v3";
    },
    _emailValidationsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/validations/email`;
    },
    _contactListUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/marketing/lists`;
    },
    _contactsSearchUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/marketing/contacts/search`;
    },
    _contactsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/marketing/contacts`;
    },
    _asmGlobalSupressionsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/asm/suppressions/global`;
    },
    _globalSupressionsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/suppression/unsubscribes`;
    },
    _sendMailUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/mail/send`;
    },
    _supressionBlocksUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/suppression/blocks`;
    },
    _supressionBouncesUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/suppression/bounces`;
    },
    _webhookSettingsUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/user/webhooks/event/settings`;
    },
    _setSignedWebhookUrl() {
      const baseUrl = this._webhookSettingsUrl();
      return `${baseUrl}/signed`;
    },
    _makeRequestConfig() {
      const authToken = this._authToken();
      const headers = {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    async _makeRequest(opts = {}) {
      opts = {
        ...this._makeRequestConfig(),
        ...opts,
      };
      const { path } = opts;
      delete opts.path;
      opts.url = `${this._apiUrl()}${path[0] === "/"
        ? ""
        : "/"}${path}`;
      return (await axios(opts)).data;
    },
    async _getAllItems(params) {
      const {
        url,
        query,
      } = params;
      const requestData = {
        query,
      };
      const requestConfig = this._makeRequestConfig();
      const { data } = await axios.post(url, requestData, requestConfig);
      return data;
    },
    _isRetriableStatusCode(statusCode) {
      [
        408,
        429,
        500,
      ].includes(statusCode);
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
          const statusCode = get(err, [
            "response",
            "status",
          ]);
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
    async getWebhookSettings() {
      const url = this._webhookSettingsUrl();
      const requestConfig = this._makeRequestConfig();
      return this._withRetries(() => axios.get(url, requestConfig));
    },
    async setWebhookSettings(webhookSettings) {
      const url = this._webhookSettingsUrl();
      const requestConfig = this._makeRequestConfig();
      return this._withRetries(() =>
        axios.patch(url, webhookSettings, requestConfig));
    },
    async _setSignedWebhook(enabled) {
      const url = this._setSignedWebhookUrl();
      const requestData = {
        enabled,
      };
      const requestConfig = this._makeRequestConfig();
      return this._withRetries(() =>
        axios.patch(url, requestData, requestConfig));
    },
    async enableSignedWebhook() {
      const { data } = await this._setSignedWebhook(true);
      return data.public_key;
    },
    async disableSignedWebhook() {
      return this._setSignedWebhook(false);
    },
    async addEmailToGlobalSupression(recipientEmails) {
      const url = this._asmGlobalSupressionsUrl();
      const requestData = {
        recipient_emails: recipientEmails,
      };
      const requestConfig = this._makeRequestConfig();
      const { data } = await this._withRetries(() =>
        axios.post(url, requestData, requestConfig));
      return data;
    },
    async addOrUpdateContacts(requestData) {
      const url = this._contactsUrl();
      const requestConfig = this._makeRequestConfig();
      requestConfig.headers["Content-Type"] = "application/json";
      const { data } = await this._withRetries(() =>
        axios.put(url, requestData, requestConfig));
      return data;
    },
    async createContactList(name) {
      const url = this._contactListUrl();
      const requestData = {
        name,
      };
      const requestConfig = this._makeRequestConfig();
      const { data } = await this._withRetries(() =>
        axios.post(url, requestData, requestConfig));
      return data;
    },
    async deleteBlocks(deleteAll, emails) {
      const requestConfig = this._makeRequestConfig();
      requestConfig.method = "DELETE";
      requestConfig.url = this._supressionBlocksUrl();
      if (deleteAll) {
        requestConfig.data = {
          delete_all: deleteAll,
        };
      } else {
        requestConfig.data = {
          emails,
        };
      }
      const { data } = await this._withRetries(() => axios(requestConfig));
      return data;
    },
    async deleteBounces(deleteAll, emails) {
      const requestConfig = this._makeRequestConfig();
      requestConfig.method = "DELETE";
      requestConfig.url = this._supressionBouncesUrl();
      if (deleteAll) {
        requestConfig.data = {
          delete_all: deleteAll,
        };
      } else {
        requestConfig.data = {
          emails,
        };
      }
      const { data } = await this._withRetries(() => axios(requestConfig));
      return data;
    },
    async deleteContacts(deleteAllContacts, ids) {
      const requestConfig = this._makeRequestConfig();
      requestConfig.method = "DELETE";
      requestConfig.url = this._contactsUrl();
      requestConfig.params = {
        delete_all_contacts: deleteAllContacts,
        ids,
      };
      const { data } = await this._withRetries(() => axios(requestConfig));
      return data;
    },
    async deleteGlobalSupression(email) {
      const requestConfig = this._makeRequestConfig();
      const url = `${this._asmGlobalSupressionsUrl()}/${email}`;
      const { data } = await this._withRetries(() =>
        axios.delete(url, requestConfig));
      return data;
    },
    async deleteList(id, deleteContacts) {
      const requestConfig = this._makeRequestConfig();
      requestConfig.method = "DELETE";
      requestConfig.url = `${this._contactListUrl()}/${id}`;
      requestConfig.params = {
        delete_contacts: deleteContacts,
      };
      const { data } = await this._withRetries(() => axios(requestConfig));
      return data;
    },
    async getBlock(email) {
      const requestConfig = this._makeRequestConfig();
      const url = `${this._supressionBlocksUrl()}/${email}`;
      const { data } = await this._withRetries(() =>
        axios.get(url, requestConfig));
      return data;
    },
    async getGlobalSupression(email) {
      const requestConfig = this._makeRequestConfig();
      const url = `${this._asmGlobalSupressionsUrl()}/${email}`;
      const { data } = await this._withRetries(() =>
        axios.get(url, requestConfig));
      return data;
    },
    async getAllBounces(startTime, endTime) {
      const requestConfig = this._makeRequestConfig();
      requestConfig.params = {
        start_time: startTime,
        end_time: endTime,
      };
      const url = this._supressionBouncesUrl();
      const { data } = await this._withRetries(() =>
        axios.get(url, requestConfig));
      return data;
    },
    async *getAllContactLists(maxItems) {
      let url = this._contactListUrl();
      while (url && maxItems > 0) {
        const params = {
          page_size: Math.min(maxItems, 1000),
        };
        const requestConfig = {
          ...this._makeRequestConfig(),
          params,
        };
        const { data } = await this._withRetries(() =>
          axios.get(url, requestConfig));
        const contactLists = data.result.slice(0, maxItems);
        for (const contactList of contactLists) {
          yield contactList;
        }
        maxItems -= contactLists.length;
        url = data._metadata.next;
      }
    },
    async *listBlocks(startTime, endTime, maxItems) {
      const url = this._supressionBlocksUrl();
      let offset = 0;
      while (maxItems > 0) {
        const params = {
          start_time: startTime,
          end_time: endTime,
          limit: Math.min(maxItems, 1000),
          offset: offset,
        };
        const requestConfig = {
          ...this._makeRequestConfig(),
          params,
        };
        const { data } = await this._withRetries(() =>
          axios.get(url, requestConfig));
        if (!data.length) {
          return;
        }
        const blocks = data.slice(0, maxItems);
        for (const block of blocks) {
          yield block;
        }
        maxItems -= blocks.length;
        offset += blocks.length;
      }
    },
    async *listGlobalSupressions(startTime, endTime, maxItems) {
      const url = this._globalSupressionsUrl();
      let offset = 0;
      while (maxItems > 0) {
        const params = {
          start_time: startTime,
          end_time: endTime,
          limit: Math.min(maxItems, 1000),
          offset: offset,
        };
        const requestConfig = {
          ...this._makeRequestConfig(),
          params,
        };
        const { data } = await this._withRetries(() =>
          axios.get(url, requestConfig));
        if (!data.length) {
          return;
        }
        const globalSupressions = data.slice(0, maxItems);
        for (const globalSupression of globalSupressions) {
          yield globalSupression;
        }
        maxItems -= globalSupressions.length;
        offset += globalSupressions.length;
      }
    },
    async makeAnAPICall(method, path, headers, body) {
      const cleanedPath = path.replace(/^\/*/, "").replace(/\/*$/, "");
      const url = `${this._apiUrl()}/${cleanedPath}`;
      const { headers: baseHeaders } = this._makeRequestConfig();
      const config = {
        method,
        url,
        headers: {
          ...baseHeaders,
          headers,
        },
        data: body,
      };
      const { data } = await this._withRetries(() => axios.request(config));
      return data;
    },
    async removeContactFromList(id, contactIds) {
      const url = `${this._contactListUrl()}/${id}/contacts`;
      const requestConfig = this._makeRequestConfig();
      requestConfig.params = {
        contact_ids: contactIds,
      };
      const { data } = await  this._withRetries(() =>
        axios.delete(url, requestConfig));
      return data;
    },
    async searchContacts(query) {
      const requestConfig = {
        method: "POST",
        url: this._contactsSearchUrl(),
        ...this._makeRequestConfig(),
        data: {
          query,
        },
      };
      const { data } = await this._withRetries(() => axios(requestConfig));
      return data;
    },
    async sendEmail(requestData) {
      const url = this._sendMailUrl();
      const requestConfig = this._makeRequestConfig();
      const { data } = await this._withRetries(() =>
        axios.post(url, requestData, requestConfig));
      return data;
    },
    async validateEmail(requestData) {
      const url = this._emailValidationsUrl();
      const requestConfig = this._makeRequestConfig();
      const { data } = await this._withRetries(() =>
        axios.post(url, requestData, requestConfig));
      return data;
    },
  },
};
