const common = require("../common-webhook");
const { mailchimp } = common.props;
const moment = require("moment");

module.exports = {
  ...common,
  key: "mailchimp-new-audience",
  name: "New Audience",
  description:
    "Emit an event when an audience is added to the connected Mailchimp account.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    server: { propDefinition: [mailchimp, "server"] },
    timer: { propDefinition: [mailchimp, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailchimpAudienceListsInfo =
        await this.mailchimp.getMailchimpAudienceLists(
          this.server,
          10,
          0,
          null,
          null
        );
      const { lists: mailchimpAudienceLists = [] } = mailchimpAudienceListsInfo;
      if (!mailchimpAudienceLists.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      this.db.set("lastDateCreated", mailchimpAudienceLists[0].date_created);
      mailchimpAudienceLists.forEach(this.emitEvent);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.created_at);
      return {
        id: eventPayload.id,
        summary: `A new audience list "${eventPayload.name}" was created.`,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    const sinceDateCreated = this.db.get("lastDateCreated");
    const beforeDateCreated = moment().toISOString();
    let mailchimpAudienceListsInfo;
    let mailchimpAudienceLists;
    let offset = 0;
    do {
      mailchimpAudienceListsInfo =
        await this.mailchimp.getMailchimpAudienceLists(
          this.server,
          1000,
          offset,
          beforeDateCreated,
          sinceDateCreated
        );
      mailchimpAudienceLists = mailchimpAudienceListsInfo.lists;
      if (!mailchimpAudienceLists.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpAudienceLists.forEach(this.emitEvent);
      this.db.set("lastDateCreated", mailchimpAudienceLists[0].date_created);
      offset = offset + mailchimpAudienceLists.length;
    } while (mailchimpAudienceLists.length > 0);
  },
};
