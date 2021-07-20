const common = require("../common.js");

module.exports = {
  ...common,
  key: "hubspot-new-deal-in-stage",
  name: "New Deal In Stage",
  description: "Emits an event for each new deal in a stage.",
  version: "0.0.3",
  dedupe: "unique",
  hooks: {},
  props: {
    ...common.props,
    stages: {
      propDefinition: [
        common.props.hubspot,
        "stages",
      ],
    },
  },
  methods: {
    ...common.methods,
    _getStage() {
      return this.db.get("stage");
    },
    _setStage(stage) {
      this.db.set("stage", stage);
    },
    generateMeta(deal, stage) {
      const {
        id,
        properties,
        updatedAt,
      } = deal;
      const { label } = stage;
      const ts = Date.parse(updatedAt);
      return {
        id: `${id}${properties.dealstage}`,
        summary: `${properties.dealname} ${label}`,
        ts,
      };
    },
    emitEvent(deal) {
      const stage = this._getStage();
      const meta = this.generateMeta(deal, stage);
      this.$emit(deal, meta);
    },
    isRelevant(deal, updatedAfter) {
      return Date.parse(deal.updatedAt) > updatedAfter;
    },
    getParams() {
      return null;
    },
    getStageParams(stage) {
      return {
        limit: 100,
        filters: [
          {
            propertyName: "dealstage",
            operator: "EQ",
            value: stage.value,
          },
        ],
        sorts: [
          {
            propertyName: "lastmodifieddate",
            direction: "DESCENDING",
          },
        ],
        object: "deals",
      };
    },
    async processResults(after) {
      for (let stage of this.stages) {
        stage = JSON.parse(stage);
        this._setStage(stage);
        const params = this.getStageParams(stage);
        await this.searchCRM(params, after);
      }
    },
  },
};
