const axios = require("axios");

module.exports = {
  type: "app",
  app: "docusign",
  propDefinitions: {
    account: {
      type: "string",
      label: "Account",
      async options() {
        const { accounts } = await this.getUserInfo();
        return accounts.map((account) => {
          return {
            label: account.account_name,
            value: account.account_id,
          };
        });
      },
    },
    template: {
      type: "string",
      label: "Template",
      async options({ account }) {
        const baseUri = await this.getBaseUri(account);
        const { envelopeTemplates } = await this.listTemplates(baseUri);
        return envelopeTemplates.map((template) => {
          return {
            label: template.name,
            value: template.templateId,
          };
        });
      },
    },
    emailSubject: {
      type: "string",
      label: "Email Subject",
      description: "Subject line of email",
    },
    emailBlurb: {
      type: "string",
      label: "Email Blurb",
      description: "Email message to recipient. Overrides template setting.",
      optional: true,
    },
    recipientEmail: {
      type: "string",
      label: "Recipient Email",
      description: "Email address of signature request recipient",
    },
    recipientName: {
      type: "string",
      label: "Recipient Name",
      description: "The full name of the recipient",
    },
    role: {
      type: "string",
      label: "Recipient Role",
      description: "Choose role as defined on template or use a custom value",
      async options({
        account, template,
      }) {
        const baseUri = await this.getBaseUri(account);
        const { signers } = await this.listTemplateRecipients(
          baseUri,
          template,
        );
        return signers.map((signer) => {
          return signer.roleName;
        });
      },
    },
  },
  methods: {
    _getHeaders() {
      return {
        "Authorization": `Bearer ${this.$auth.oauth_access_token}`,
        "Content-Type": "application/json",
      };
    },
    async _makeRequest(method, url, data = null, params = null) {
      if (params) {
        const queryString = Object.keys(params)
          .map((key) => key + "=" + params[key])
          .join("&");
        url = `${url}?${queryString}`;
      }
      const config = {
        method,
        url,
        headers: this._getHeaders(),
        data,
      };
      return (await axios(config)).data;
    },
    async getUserInfo() {
      return await this._makeRequest(
        "GET",
        "https://account-d.docusign.com/oauth/userinfo",
      );
    },
    async getBaseUri(accountId) {
      const { accounts } = await this.getUserInfo();
      const account = accounts.find((a) => a.account_id === accountId);
      const { base_uri: baseUri } = account;
      return `${baseUri}/restapi/v2.1/accounts/${accountId}/`;
    },
    async listTemplates(baseUri) {
      return await this._makeRequest("GET", `${baseUri}templates`);
    },
    async listTemplateRecipients(baseUri, templateId) {
      return await this._makeRequest(
        "GET",
        `${baseUri}templates/${templateId}/recipients`,
      );
    },
    async createEnvelope(baseUri, data) {
      return await this._makeRequest("POST", `${baseUri}envelopes`, data);
    },
    async listFolders(baseUri, params) {
      return await this._makeRequest("GET", `${baseUri}folders`, null, params);
    },
    async listEnvelopes(baseUri, params) {
      return await this._makeRequest(
        "GET",
        `${baseUri}envelopes`,
        null,
        params,
      );
    },
  },
};
