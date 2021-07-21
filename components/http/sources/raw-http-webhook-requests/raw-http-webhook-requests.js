const httpApp = require("../../http.app");

// Core HTTP component
module.exports = {
  key: "http-new-requests",
  name: "Raw HTTP / Webhook Requests",
  description: "Get a Pipedream URL to catch, inspect and emit the full HTTP event on every request (including the body, method, headers, query parameters). Send payloads up to 512k or add `pipedream_upload_body=1` as a query parameter to send payloads up to 5 terabytes).",
  version: "0.0.3",
  props: {
    http: {
      type: "$.interface.http",
      customResponse: true,
    },
    emitBodyOnly: {
      type: "boolean",
      label: "Body Only",
      description: "This source emits an event representing the full HTTP request by default. Select `TRUE` to emit the body only.",
      optional: true,
      default: false,
    },
    resStatusCode: {
      type: "string",
      label: "Response Status Code",
      description: "The status code to return in the HTTP response.",
      optional: true,
      default: "200",
    },
    resContentType: {
      type: "string",
      label: "Response Content-Type",
      description: "The content-type of the body returned in the HTTP response.",
      optional: true,
      default: "application/json",
    },
    resBody: {
      type: "string",
      label: "Response Body",
      description: "The body to return in the HTTP response.",
      optional: true,
      default: `{ "success": true }`,
    },
    filterFaviconRequests: {
      type: "boolean",
      label: "Exclude Favicon Requests",
      description: "Modern browsers make a request for `/favicon.ico` when a URL is loaded in the address bar. This source filters these requests out by default. Select `FALSE` to emit all requests received by this source, including those for `/favicon.ico`.",
      optional: true,
      default: true,
    },
    http_app: httpApp,
  },
  async run(event) {
    // return to end execution on requests for favicon.ico
    if (this.filterFaviconRequests && event.path === "/favicon.ico")  return;

    const summary = `${event.method} ${event.path}`;

    this.http.respond({
      status: this.resStatusCode,
      body: this.resBody,
      headers: {
        "content-type": this.resContentType,
      },
    });

    if (this.emitBodyOnly) {
      const body = event.body;
      this.$emit({
        body,
      }, {
        summary,
      });
    } else {
      this.$emit(event, {
        summary,
      });
    }
  },
};
