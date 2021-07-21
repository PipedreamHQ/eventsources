const common = require("../common.js");

module.exports = {
  ...common,
  key: "docusign-envelope-sent-or-complete",
  name: "Envelope Sent or Complete",
  description:
    "Emits an event when an envelope status is set to sent or complete",
  version: "0.0.1",
  dedupe: "unique",
  methods: {
    ...common.methods,
    _getLastEvent() {
      return this.db.get("lastEvent");
    },
    _setLastEvent(lastEvent) {
      this.db.set("lastEvent", lastEvent);
    },
    generateMeta({
      envelopeId: id, emailSubject: summary,
    }, ts) {
      return {
        id,
        summary,
        ts,
      };
    },
  },
  async run(event) {
    const { timestamp: ts } = event;
    const lastEvent = this._getLastEvent() || this.monthAgo().toISOString();
    const baseUri = this._getBaseUri();
    let done = false;
    const params = {
      from_date: lastEvent,
      status: "sent,completed",
    };
    do {
      const {
        envelopes = [],
        nextUri,
        endPosition,
      } = await this.docusign.listEnvelopes(baseUri, params);
      if (nextUri) params.start_position += endPosition + 1;
      else done = true;

      for (const envelope of envelopes) {
        this.emitEvent(envelope, ts);
      }
    } while (!done);
    this._setLastEvent(new Date(ts * 1000).toISOString());
  },
};
