const axios = require("axios");
const parseLinkHeader = require("parse-link-header");
const slugify = require("slugify");

module.exports = {
  type: "app",
  app: "sentry",
  propDefinitions: {
    organizationSlug: {
      type: "string",
      label: "Organization",
      description: "The organization for which to consider issues events",
      async options(context) {
        const url = this._organizationsEndpoint();
        const params = {};  // We don't need to provide query parameters at the moment.
        const { data, next } = await this._propDefinitionsOptions(url, params, context);
        const options = data.map(this._organizationObjectToOption);
        return {
          options,
          context: {
            nextPage: next,
          },
        };
      },
    },
  },
  methods: {
    _apiUrl() {
      return "https://sentry.io/api/0";
    },
    _organizationsEndpoint() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/organizations/`;
    },
    _integrationsEndpoint(integrationSlug) {
      const baseUrl = this._apiUrl();
      const url = `${baseUrl}/sentry-apps/`;
      return integrationSlug ? `${url}/${integrationSlug}/` : url;
    },
    _authToken() {
      return this.$auth.auth_token;
    },
    _makeRequestConfig() {
      const authToken = this._authToken();
      const headers = {
        "Authorization": `Bearer ${authToken}`,
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    _organizationObjectToOption(organization) {
      const { name, slug } = organization;
      const label = `${name} (${slug})`;
      return {
        label,
        value: slug,
      };
    },
    async _propDefinitionsOptions(url, params, { page, prevContext }) {
      let requestConfig = this._makeRequestConfig();  // Basic axios request config
      if (page === 0) {
        // First time the options are being retrieved.
        // Include the parameters provided, which will be persisted
        // across the different pages.
        requestConfig = {
          ...requestConfig,
          params,
        };
      } else if (prevContext.nextPage) {
        // Retrieve next page of options.
        url = prevContext.nextPage.url;
      } else {
        // No more options available.
        return { data: [] };
      }

      const {
        data,
        headers: { link },
      } = await axios.get(url, requestConfig);
      // https://docs.sentry.io/api/pagination/
      const { next } = parseLinkHeader(link);

      return {
        data,
        next,
      };
    },
    _baseIntegrationParams() {
      return {
        scopes: [
          "event:read",
        ],
        events: [
          "issue",
        ],
        isAlertable: true,
        isInternal: true,
        verifyInstall: false,
      };
    },
    _formatIntegrationName(rawName) {
      const options = {
        remove: /[()]/g,
        lower: true,
      };
      const enrichedRawName = `pd-${rawName}`;
      return slugify(enrichedRawName, options).substring(0, 57);
    },
    async createIntegration(eventSourceName, organization, webhookUrl) {
      const url = this._integrationsEndpoint();
      const name = this._formatIntegrationName(eventSourceName);
      const requestData = {
        ...this._baseIntegrationParams(),
        name,
        organization,
        webhookUrl,
      };
      const requestConfig = this._makeRequestConfig();
      const { data } = await axios.post(url, requestData, requestConfig);
      return data;
    },
    async deleteIntegration(integrationSlug) {
      const url = this._integrationsEndpoint(integrationSlug);
      const requestConfig = this._makeRequestConfig();
      await axios.delete(url, requestConfig);
    },
  },
};
