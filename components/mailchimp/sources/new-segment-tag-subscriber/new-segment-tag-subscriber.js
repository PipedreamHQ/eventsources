const common = require("../common-webhook");
const { mailchimp } = common.props;

module.exports = {
  ...common,
  key: "mailchimp-new-segment-tag-subscriber",
  name: "New Segment Tag Subscriber",
  description:
    "Emit an event when an subscriber is added to a segment or tags within an audience list.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    server: { propDefinition: [mailchimp, "server"] },
    listId: {
      type: "string",
      label: "Audience List Id",
      description:
        "The unique ID of the audience list related to the segment or tag you'd like to watch for new subscribers.",
    },
    segmentId: {
      type: "string",
      label: "Segment/Tag Id",
      description:
        "The unique ID of the segment or tag you'd like to watch for new subscribers.",
    },
    includeTransactional: {
      type: "boolean",
      label: "Include subscribers from Mailchimp Transactional?",
      description:
        "If set to `true`, it will include subscribers from Mailchimp Marketing and Mailchimp Transactional, formerly Mandrill.  When set to `false`, it will include subscribers from Mailchimp Marketing only.",
      default: false,
      optional: true,
    },
    timer: { propDefinition: [mailchimp, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailchimpSegmentMembersInfo =
        await this.mailchimp.getSegmentMembersList(
          this.server,
          this.listId,
          this.segmentId,
          10,
          0,
          this.includeTransactional
        );

      const { members: mailchimpSegmentMembers = [] } =
        mailchimpSegmentMembersInfo;
      if (!mailchimpSegmentMembers.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpSegmentMembers.forEach(this.emitEvent);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.timestamp_opt);
      return {
        id: eventPayload.id,
        summary: `A new subscriber "${eventPayload.merge_fields.FNAME}" was added to a segment or tag. `,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    let mailchimpSegmentMembersInfo;
    let mailchimpSegmentMembers;
    let offset = 0;
    do {
      mailchimpSegmentMembersInfo = await this.mailchimp.getSegmentMembersList(
        this.server,
        this.listId,
        this.segmentId,
        1000,
        offset,
        this.includeTransactional
      );
      mailchimpSegmentMembers = mailchimpSegmentMembersInfo.members;
      if (!mailchimpSegmentMembers.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpSegmentMembers.forEach(this.emitEvent);
      offset = offset + mailchimpSegmentMembers.length;
    } while (mailchimpSegmentMembers.length > 0);
  },
};
