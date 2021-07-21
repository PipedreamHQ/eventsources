const axios = require("@dylburger/platform").axios;
const http = require("../../http.app.js");

module.exports = {
  key: "http-custom-request",
  name: "Custom Request",
  description:
    "Make an HTTP request using any `method` and `URL`. Optionally configure query string parameters, headers and basic auth.",
  type: "action",
  version: "0.0.22",
  props: {
    http,
    url: {
      propDefinition: [
        http,
        "url",
      ],
    },
    method: {
      propDefinition: [
        http,
        "method",
      ],
    },
    body: {
      propDefinition: [
        http,
        "body",
      ],
    },
    params: {
      propDefinition: [
        http,
        "params",
      ],
    },
    headers: {
      propDefinition: [
        http,
        "headers",
      ],
    },
    auth: {
      propDefinition: [
        http,
        "auth",
      ],
    },
  },
  methods: {},
  async run({ $ }) {
    const config = {
      url: this.url,
      method: this.method,
      data: this.body,
      params: this.params,
      headers: this.headers,
    };
    if (this.auth) config.auth = this.http.parseAuth(this.auth);
    // Pipedream axios returns data directly
    return await axios($, config);
  },
};
