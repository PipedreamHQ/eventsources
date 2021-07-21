const docusign = require("../docusign.app.js");

module.exports = {
  props: {
    docusign,
    account: {
      propDefinition: [
        docusign,
        "account",
      ],
    },
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15,
      },
    },
  },
  methods: {
    _getBaseUri() {
      return this.db.get("baseUri");
    },
    _setBaseUri(baseUri) {
      this.db.set("baseUri", baseUri);
    },
    monthAgo() {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    },
    emitEvent(result, ts) {
      const meta = this.generateMeta(result, ts);
      this.$emit(result, meta);
    },
  },
  hooks: {
    async deploy() {
      const baseUri = await this.docusign.getBaseUri(this.account);
      this._setBaseUri(baseUri);
    },
  },
};
