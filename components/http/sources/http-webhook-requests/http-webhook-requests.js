const httpApp = require("../../http.app");

// Core HTTP component
// Returns a 200 OK response, emits the HTTP payload as an event
module.exports = {
  key: "http-new-requests-payload-only",
  name: "HTTP / Webhook Requests",
  description: "Get a Pipedream URL to catch, inspect and emit the HTTP body on every request. Send payloads up to 512k or add `pipedream_upload_body=1` as a query parameter to send payloads up to 5 terabytes).",
  version: "0.0.3",
  props: {
    http: {
      type: "$.interface.http",
      customResponse: true,
    },
    emptyResponse: {
      type: "boolean",
      label: "Return Empty Response",
      description: "Set to `true` to return an empty response (HTTP `204 No Content`). Returns `{ success: true }` by default.",
      default: false,
      optional: true,
    },
    http_app: httpApp,
  },
  async run(event) {
    // return to end execution on requests for favicon.ico
    if (event.path === "/favicon.ico")  return;

    const { body } = event;

    if (this.emptyResponse) {
      this.http.respond({
        status: 204,
      });
    } else {
      this.http.respond({
        status: 200,
        body: {
          success: true,
        },
      });
    }

    // Emit the HTTP payload
    this.$emit({
      body,
    }, {
      summary: `${event.method.toUpperCase()} ${event.path}`,
    });
  },
};
