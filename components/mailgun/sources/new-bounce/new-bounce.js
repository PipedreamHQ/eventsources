const common = require("../common-webhook");
const { mailgun } = common.props;

module.exports = {
  ...common,
  key: "mailgun-new-bounce",
  name: "New Bounce",
  description:
    "Emit an event when the email recipient could not be reached.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    domain: { propDefinition: [mailgun, "domain"] },
  },
  methods: {
    ...common.methods,
    getEventName() {
      return ["bounce"];
    },
    getEventType() {
      return ["bounced"];
    },
    generateMeta(eventPayload) {
      const ts = eventPayload.timestamp;
      return {
        id: `${eventPayload["X-Mailgun-Sid"]}${ts}`,
        summary: eventPayload.recipient,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const eventTypes = this.getEventType();
      if (eventTypes.includes(eventPayload.event)) {
        const meta = this.generateMeta(eventPayload);
        this.$emit(eventPayload, meta);
      }
    },
  },
  /**
   * The run method in the mailgun-new-bounce source is overriding the definition from the
   * common-webhook file because the Mailgun API ultimately sends a different data structure when
   * reporting email bouncing events. In new Mailgun API endpoints signature and event-data are
   * wrapped inside separated object, for mailgun-new-bounce the signature and event data are
   * inside the same object. Worth noting is that the Mailgun API endpoint for mailgun-new-bounce
   * is deprecated.
   * */
  async run(event) {
    const eventWorkload = event.body;
    const { timestamp, token, signature } = eventWorkload;
    if (!this.verify(this.webhookSigningKey, timestamp, token, signature)) {
      this.http.respond({ status: 404 });
      console.log("Invalid event. Skipping...");
      return;
    }
    this.emitEvent(eventWorkload);
  },
};
