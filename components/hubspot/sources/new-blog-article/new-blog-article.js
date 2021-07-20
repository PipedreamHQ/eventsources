const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-blog-article",
  name: "New Blog Posts",
  description: "Emits an event for each new blog post.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(blogpost) {
      const {
        id,
        name: summary,
      } = blogpost;
      const ts = Date.parse(blogpost.created);
      return {
        id,
        summary,
        ts,
      };
    },
    getParams(after) {
      return {
        limit: 100,
        createdAfter: after, // return entries created since event last ran
      };
    },
    async processResults(after, params) {
      await this.paginate(
        params,
        this.hubspot.getBlogPosts.bind(this),
        "results",
      );
    },
  },
};
