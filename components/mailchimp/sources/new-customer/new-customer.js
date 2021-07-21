const common = require("../common-webhook");
const { mailchimp } = common.props;

module.exports = {
  ...common,
  key: "mailchimp-new-customer",
  name: "New Customer",
  description:
    "Emit an event when a new customer is added to a selected store.",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    mailchimp,
    server: { propDefinition: [mailchimp, "server"] },
    storeId: {
      type: "string",
      label: "Store Id",
      description:
        "The unique ID of the store you'd like to watch for new customers.",
    },
    timer: { propDefinition: [mailchimp, "timer"] },
    db: "$.service.db",
  },
  hooks: {
    async deploy() {
      // Emits sample events on the first run during deploy.
      const mailchimpStoreCustomersInfo =
        await this.mailchimp.getAllStoreCustomers(
          this.server,
          this.storeId,
          10,
          0
        );
      const { customers: mailchimpStoreCustomers = [] } =
        mailchimpStoreCustomersInfo;
      if (!mailchimpStoreCustomers.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpStoreCustomers.forEach(this.emitEvent);
    },
  },
  methods: {
    ...common.methods,
    generateMeta(eventPayload) {
      const ts = +new Date(eventPayload.created_at);
      return {
        id: eventPayload.id,
        summary: `New customer "${eventPayload.first_name} ${eventPayload.last_name}" was added to your store. `,
        ts,
      };
    },
    emitEvent(eventPayload) {
      const meta = this.generateMeta(eventPayload);
      this.$emit(eventPayload, meta);
    },
  },
  async run() {
    let mailchimpStoreCustomersInfo;
    let mailchimpStoreCustomers;
    let offset = 0;
    do {
      mailchimpStoreCustomersInfo = await this.mailchimp.getAllStoreCustomers(
        this.server,
        this.storeId,
        1000,
        offset
      );
      mailchimpStoreCustomers = mailchimpStoreCustomersInfo.customers;
      if (!mailchimpStoreCustomers.length) {
        console.log("No data available, skipping iteration");
        return;
      }
      mailchimpStoreCustomers.forEach(this.emitEvent);
      offset = offset + mailchimpStoreCustomers.length;
    } while (mailchimpStoreCustomers.length > 0);
  },
};
