const mailgun = require("../mailgun.app");
const get = require("lodash/get");

module.exports = {
  props: {
    mailgun,
    webhookSigningKey: {
      type: "string",
      secret: true,
      label: "Mailgun webhook signing key",
      description:
        "Your Mailgun webhook signing key, found [in your Mailgun dashboard](https://app.mailgun.com/app/dashboard), located under Settings on the left-hand nav and then in API Keys look for webhook signing key. Required to compute the authentication signature of events.",
    },
    http: "$.interface.http",
    db: "$.service.db",
  },
  methods: {
    getEventName() {
      throw new Error("getEventName is not implemented");
    },
    getEventType() {
      throw new Error("getEventType is not implemented");
    },
    verify(signingKey, timestamp, token, signature) {
      const crypto = require("crypto");
      const encodedToken = crypto
        .createHmac("sha256", signingKey)
        .update(timestamp.concat(token))
        .digest("hex");
      return encodedToken === signature;
    },
    emitEvent(eventPayload) {
      const eventTypes = this.getEventType();
      if (eventTypes.includes(eventPayload.event)) {
        const meta = this.generateMeta(eventPayload);
        this.$emit(eventPayload, meta);
      }
    },
  },
  hooks: {
    async activate() {
      const webhookNames = this.getEventName();
      for (const webhookName of webhookNames) {
        const webhookDetails = await this.mailgun.getWebhookDetails(
          this.domain,
          webhookName
        );
        const newWebhookUrls = get(webhookDetails, "urls", []);
        if (newWebhookUrls.length) {
          newWebhookUrls.push(this.http.endpoint);
          await this.mailgun.updateWebhook(
            this.domain,
            webhookName,
            newWebhookUrls
          );
        } else {
          await this.mailgun.createWebhook(
            this.domain,
            webhookName,
            this.http.endpoint
          );
        }
      }
    },
    async deactivate() {
      const webhookNames = this.getEventName();
      for (const webhookName of webhookNames) {
        const webhookDetails = await this.mailgun.getWebhookDetails(
          this.domain,
          webhookName
        );
        const currentWebhookUrls = get(webhookDetails, "urls", []);
        if (currentWebhookUrls.length > 1) {
          const newWebhookUrls = currentWebhookUrls.filter(
            (url) => url !== this.http.endpoint
          );
          await this.mailgun.updateWebhook(
            this.domain,
            webhookName,
            newWebhookUrls
          );
        } else {
          await this.mailgun.deleteWebhook(this.domain, webhookName);
        }
      }
    },
  },
  async run(event) {
    const hasSignature  = get(event, ['body', 'signature'])
    if (!hasSignature) {
      console.log("No signature present in event")
      return;
    }
    const { timestamp, token, signature } = event.body.signature;
    const eventPayload = event.body["event-data"];
    if (!this.verify(this.webhookSigningKey, timestamp, token, signature)) {
      this.http.respond({ status: 404 });
      console.log("Invalid event. Skipping...");
      return;
    }
    this.emitEvent(eventPayload);
  },
};
