const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-engagement",
  name: "New Engagement",
  description: "Emits an event for each new engagement created.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(engagement) {
      const {
        id,
        type,
        createdAt,
      } = engagement.engagement;
      const ts = Date.parse(createdAt);
      return {
        id,
        summary: type,
        ts,
      };
    },
    isRelevant(engagement, createdAfter) {
      return engagement.engagement.createdAt > createdAfter;
    },
  },
  async run() {
    const createdAfter = this._getAfter();
    const params = {
      limit: 250,
    };

    await this.paginateUsingHasMore(
      params,
      this.hubspot.getEngagements.bind(this),
      "results",
      createdAfter,
    );
  },
};
