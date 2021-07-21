const common = require("../common-webhook");
const { mailchimp } = common.props;
const moment = require("moment");

module.exports = {
  ...common,
  key: "mailchimp-new-or-updated-list-segment",
  name: "New Or Updated List Segment",
  description: "Emit an event when segment is either created or updated.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    listId: {
      type: "string",
      label: "Audience List Id",
      description:
        "The unique ID of the audience list which you'd like to watch for new or updated segments.",
    },
    watchFor: {
      type: "string",
      label: "Watch for new created or updated segments?",
      description:
        "If set to `Created`, it will include new created segments only.  When set to `Updated`, it will only include recently updated segments.",
      options: ["Created", "Updated"],
      optional: false,
    },
    includeTransactional: {
      type: "boolean",
      label: "Include subscribers from Mailchimp Transactional?",
      description:
        "If set to `true`, it will include subscribers from Mailchimp Marketing and Mailchimp Transactional, formerly Mandrill.  When set to `false`, it will include subscribers from Mailchimp Marketing only.",
      default: false,
      optional: true,
    },
    server: { propDefinition: [mailchimp, "server"] },
    timer: { propDefinition: [mailchimp, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailchimpAudienceSegmentsInfo =
        await this.mailchimp.getAudienceSegments(
          this.server,
          this.listId,
          10,
          0,
          null,
          null,
          null,
          null
        );
      const { segments: mailchimpAudienceSegments = [] } =
        mailchimpAudienceSegmentsInfo;
      if (!mailchimpAudienceSegments.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      const relevantDate = ["Created"].includes(this.watchFor)
        ? mailchimpAudienceSegments[0].created_at
        : mailchimpAudienceSegments[0].updated_at;
      this.db.set("lastRelevantDate", relevantDate);
      mailchimpAudienceSegments.forEach(this.emitEvent);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      if (["Created"].includes(this.watchFor)) {
        return {
          id: eventPayload.id,
          summary: `A new segment "${eventPayload.name}" was created.`,
          ts: +new Date(eventPayload.created_at),
        };
      } else {
        const ts = +new Date(eventPayload.updated_at);
        return {
          id: `${eventPayload.id}${ts}`,
          summary: `Segment "${eventPayload.name}" was updated.`,
          ts,
        };
      }
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    let sinceCreatedAt;
    let beforeCreatedAt;
    let sinceUpdatedAt;
    let beforeUpdatedAt;
    if (["Created"].includes(this.watchFor)) {
      sinceCreatedAt = this.db.get("lastRelevantDate");
      beforeCreatedAt = moment().toISOString();
    } else {
      sinceUpdatedAt = this.db.get("lastRelevantDate");
      beforeUpdatedAt = moment().toISOString();
    }
    let mailchimpAudienceSegmentsInfo;
    let mailchimpAudienceSegments;
    let offset = 0;
    do {
      mailchimpAudienceSegmentsInfo = await this.mailchimp.getAudienceSegments(
        this.server,
        this.listId,
        1000,
        offset,
        sinceCreatedAt,
        beforeCreatedAt,
        sinceUpdatedAt,
        beforeUpdatedAt
      );
      mailchimpAudienceSegments = mailchimpAudienceSegmentsInfo.segments;
      if (!mailchimpAudienceSegments.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpAudienceSegments.forEach(this.emitEvent);
      const relevantDate = ["Created"].includes(this.watchFor)
        ? mailchimpAudienceSegments[0].created_at
        : mailchimpAudienceSegments[0].updated_at;
      this.db.set("lastRelevantDate", relevantDate);
      offset = offset + mailchimpAudienceSegments.length;
    } while (mailchimpAudienceSegments.length > 0);
  },
};
