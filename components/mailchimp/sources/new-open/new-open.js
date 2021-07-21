const common = require("../common-webhook");
const { mailchimp } = common.props;
const moment = require("moment");

module.exports = {
  ...common,
  key: "mailchimp-new-open",
  name: "New Open",
  description:
    "Emit an event when a recipient opens an email in a specific campaign.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    campaignId: {
      type: "string",
      label: "Campaign Id",
      description:
        "The unique ID of the campaign you'd like to watch for new email opens on links.",
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
      this.db.set("recipientOpens", mailchimpCampaign.report_summary.opens);
      this.emitEvent(mailchimpCampaign);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date();
      return {
        id: ts,
        summary: `Campaign "${eventPayload.settings.title}" now has ${eventPayload.report_summary.opens} recipient opens.`,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    const savedRecipientOpens = parseInt(this.db.get("recipientOpens"));
    const mailchimpCampaign = await this.mailchimp.getMailchimpCampaignInfo(
      this.server,
      this.campaignId
    );
    if (!mailchimpCampaign) {
      console.log("No data available, skipping iteration");
      return;
    }
    const currentRecipientOpens = parseInt(
      mailchimpCampaign.report_summary.opens
    );
    if (currentRecipientOpens > savedRecipientOpens) {
      this.db.set("recipientOpens", currentRecipientOpens);
      this.emitEvent(mailchimpCampaign);
    }
  },
};
