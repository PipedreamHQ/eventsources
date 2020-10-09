const axios = require("axios");
const crypto = require("crypto");
const jwt = require('jwt-simple');
const NetlifyAPI = require("netlify");
const parseLinkHeader = require('parse-link-header');

module.exports = {
  type: "app",
  app: "netlify",
  propDefinitions: {
    siteId: {
      type: "string",
      label: "Site ID",
      description: "The site for which events must be captured",
      async options(context) {
        // At the moment we need to "manually" query these items
        // instead of using the Netlify client, since it doesn't support
        // pagination.
        const url = this._sitesEndpoint();
        const params = {
          per_page: 10,
        };
        const { data, next } = await this._propDefinitionsOptions(url, params, context);

        const options = data.map(site => ({
          label: site.name,
          value: site.id,
        }));
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
      return "https://api.netlify.com/api/v1";
    },
    _sitesEndpoint() {
      const baseUrl = this._apiUrl();
      return `${baseUrl}/sites`;
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

      const { data, headers } = await axios.get(url, requestConfig);
      // https://docs.netlify.com/api/get-started/#link-header
      const { next } = parseLinkHeader(headers.link);

      return {
        data,
        next,
      };
    },
    generateToken() {
      return crypto.randomBytes(32).toString("hex");
    },
    createClient() {
      const opts = {
        userAgent: "@PipedreamHQ/pipedream v0.1",
        pathPrefix: "/api/v1",
        accessToken: this.$auth.oauth_access_token,
      };
      return new NetlifyAPI(opts);
    },
    async createHook(opts) {
      const {
        event,
        url,
        siteId,
      } = opts;
      const token = this.generateToken();
      const hookOpts = {
        type: "url",
        event,
        data: {
          url,
          signature_secret: token,
        },
      };
      const requestParams = {
        site_id: siteId,
        body: hookOpts,
      };

      const netlifyClient = this.createClient();
      const { id } = await netlifyClient.createHookBySiteId(requestParams);
      console.log(
        `Created "${event}" webhook for site ID ${siteId}.
        (Hook ID: ${id}, endpoint: ${url})`
      );

      return {
        hookId: id,
        token,
      };
    },
    async deleteHook(opts) {
      const { hookId, siteId } = opts;
      const requestParams = {
        hook_id: hookId,
      };

      const netlifyClient = this.createClient();
      await netlifyClient.deleteHook(requestParams);
      console.log(
        `Deleted webhook for site ID ${siteId}.
        (Hook ID: ${hookId})`
      );
    },
    isValidSource(headers, bodyRaw, db) {
      // Verifies that the event is really coming from Netlify.
      // See https://docs.netlify.com/site-deploys/notifications/#payload-signature
      const signature = headers["x-webhook-signature"];
      const token = db.get("token");
      const { sha256 } = jwt.decode(signature, token);
      const encoded = crypto
        .createHash('sha256')
        .update(bodyRaw)
        .digest('hex');
      return sha256 === encoded;
    },
  },
};
