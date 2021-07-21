const axios = require("axios");

module.exports = {
  type: "app",
  app: "zeit",
  propDefinitions: {
    projectName: {
      type: "string",
      label: "Project Name",
      description: "The name of the project",
      async options(context) {
        const { from = 0 } = context.prevContext;
        const url = this._userProjectsEndpoint();
        const params = {
          from,
        };

        const {
          data,
          next,
        } = await this._propDefinitionsOptions(url, params, context);

        const options = data.map((project) => project.name);
        return {
          options,
          context: {
            from: next,
          },
        };
      },
    },
  },
  methods: {
    _apiUrl() {
      return "https://api.vercel.com";
    },
    _hooksEndpointUrl() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/v1/integrations/webhooks`;
    },
    _hookEndpointUrl(hookId) {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/v1/integrations/webhooks/${hookId}`;
    },
    _userProjectsEndpoint() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/v4/projects/`;
    },
    _authToken() {
      return this.$auth.oauth_access_token;
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
    async _propDefinitionsOptions(url, params, { page }) {
      const baseRequestConfig = this._makeRequestConfig();
      const requestConfig = {
        ...baseRequestConfig,
        params,
      };
      const { data } = await axios.get(url, requestConfig);
      const {
        projects,
        pagination,
      } = data;

      // When retrieving items from subsequent pages, the Vercel API
      // response has as its first element the same one that was provided
      // as the last element in the previous page.
      const effectiveData = page !== 0
        ? projects.slice(1)
        : projects;

      return {
        data: effectiveData,
        next: pagination.next,
      };
    },
    async createHook(opts) {
      const {
        projectName,
        hookParams,
      } = opts;
      const url = this._hooksEndpointUrl();
      const name = `Pipedream - Hook for project ${projectName}`;
      const requestData = {
        ...hookParams,
        name,
      };
      const requestConfig = this._makeRequestConfig();
      const { data } = await axios.post(url, requestData, requestConfig);
      return {
        hookId: data.id,
      };
    },
    deleteHook(opts) {
      const { hookId } = opts;
      const url = this._hookEndpointUrl(hookId);
      const requestConfig = this._makeRequestConfig();
      return axios.delete(url, requestConfig);
    },
    isEventForThisProject(opts) {
      // Vercel webhooks cannot be linked to a particular project,
      // but they are rather called for an event on any of the projects
      // under an account.
      // As a consequence, we need to make sure we're only capturing and
      // processing the events related to this particualr project.
      const {
        body,
        projectName,
      } = opts;
      const { name } = body.payload;
      return projectName === name;
    },
  },
};
