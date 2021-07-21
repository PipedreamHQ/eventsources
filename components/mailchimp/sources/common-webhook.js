const mailchimp = require("../mailchimp.app");

module.exports = {
  props: {
    mailchimp,
    triggeredByUser: {
      type: "boolean",
      label: "Trigger on subscriber actions?",
      description:
        "If set to true, events will be emitted on subscriber-initiated actions.",
      default: false,
    },
    triggeredByAdmin: {
      type: "boolean",
      label: "Trigger on actions by Mailchimp admin?",
      description:
        "If set to true, events will be emitted on admin-initiated actions in the web interface.",
      default: false,
    },
    triggeredByApi: {
      type: "boolean",
      label: "Trigger via actions on the API?",
      description:
        "If set to true, events will be emitted on actions initiated via the API.",
      default: false,
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
    emitEvent(eventPayload) {
      const eventTypes = this.getEventType();
      if (eventTypes.includes(eventPayload.type)) {
        const meta = this.generateMeta(eventPayload);
        this.$emit(eventPayload, meta);
      }
    },
    getEventsConfig() {
      const eventName = this.getEventName();
      let eventsCfg = {};
      eventsCfg.subscribedEvents = {};
      eventsCfg.eventSources = {};
      eventsCfg.subscribedEvents.subscribe = eventName.includes("subscribe");
      eventsCfg.subscribedEvents.unsubscribe =
        eventName.includes("unsubscribe");
      eventsCfg.subscribedEvents.profile = eventName.includes("profile");
      eventsCfg.subscribedEvents.cleaned = eventName.includes("cleaned");
      eventsCfg.subscribedEvents.upemail = eventName.includes("upemail");
      eventsCfg.subscribedEvents.campaign = eventName.includes("campaign");
      eventsCfg.eventSources.user = this.triggeredByUser;
      eventsCfg.eventSources.admin = this.triggeredByAdmin;
      eventsCfg.eventSources.api = this.triggeredByApi;
      return eventsCfg;
    },
  },
  hooks: {
    async activate() {
      const eventsCfg = this.getEventsConfig();
      const webhook = await this.mailchimp.createWebhook(
        this.server,
        this.listId,
        this.http.endpoint,
        eventsCfg.subscribedEvents,
        eventsCfg.eventSources
      );
      this.db.set("webhookId", webhook.id);
    },
    async deactivate() {
      await this.mailchimp.deleteWebhook(
        this.server,
        this.listId,
        this.db.get("webhookId")
      );
    },
  },
  async run(event) {
    const { body } = event;
    if (!body) {
      //Probably a Mailchimp response sent on webhook registration.
      console.log("No body present in event");
      return;
    }
    this.emitEvent(body);
  },
};
