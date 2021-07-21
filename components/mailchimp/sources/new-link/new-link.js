const common = require("../common-webhook");
const { mailchimp } = common.props;
const moment = require("moment");

module.exports = {
  ...common,
  key: "mailchimp-new-link",
  name: "New Link",
  description:
    "Emit an event when a recipient clicks a pre-specified link in an specific campaign.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    campaignId: {
      type: "string",
      label: "Campaign Id",
      description:
        "The unique ID of the campaign you'd like to watch for new clicks on links.",
    },
    server: { propDefinition: [mailchimp, "server"] },
    timer: { propDefinition: [mailchimp, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailchimpCampaign = await this.mailchimp.getMailchimpCampaignInfo(
        this.server,
        this.campaignId
      );
      if (!mailchimpCampaign) {
        console.log("No data available, skipping iteration");
        return;
      }
      this.db.set("recipientClicks", mailchimpCampaign.report_summary.clicks);
      this.emitEvent(mailchimpCampaign);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date();
      return {
        id: ts,
        summary: `Campaign "${eventPayload.settings.title}" now has ${eventPayload.report_summary.clicks} subscriber clicks.`,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    const savedRecipientClicks = parseInt(this.db.get("recipientClicks"));
    const mailchimpCampaign = await this.mailchimp.getMailchimpCampaignInfo(
      this.server,
      this.campaignId
    );
    if (!mailchimpCampaign) {
      console.log("No data available, skipping iteration");
      return;
    }
    const currentRecipientClicks = parseInt(
      mailchimpCampaign.report_summary.clicks
    );
    if (currentRecipientClicks > savedRecipientClicks) {
      this.db.set("recipientClicks", currentRecipientClicks);
      this.emitEvent(mailchimpCampaign);
    }
  },
};
