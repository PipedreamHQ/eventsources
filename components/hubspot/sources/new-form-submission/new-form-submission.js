const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-form-submission",
  name: "New Form Submission",
  description: "Emits an event for each new submission of a form.",
  version: "0.0.3",
  dedupe: "unique",
  props: {
    ...common.props,
    forms: {
      propDefinition: [
        common.props.hubspot,
        "forms",
      ],
    },
  },
  hooks: {},
  methods: {
    ...common.methods,
    generateMeta(result) {
      const {
        pageUrl,
        submittedAt: ts,
      } = result;
      const submitted = new Date(ts);
      return {
        id: `${pageUrl}${ts}`,
        summary: `Form submitted at ${submitted.toLocaleDateString()} ${submitted.toLocaleTimeString()}`,
        ts,
      };
    },
    isRelevant(result, submittedAfter) {
      return result.submittedAt > submittedAfter;
    },
    getParams() {
      return {
        limit: 50,
      };
    },
    async processResults(after, baseParams) {
      await Promise.all(
        this.forms
          .map(JSON.parse)
          .map(({ value }) => ({
            ...baseParams,
            formId: value,
          }))
          .map((params) =>
            this.paginate(
              params,
              this.hubspot.getFormSubmissions.bind(this),
              "results",
              after,
            )),
      );
    },
  },
};
