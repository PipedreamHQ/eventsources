const vercel = require("https://github.com/PipedreamHQ/pipedream/components/vercel/vercel.app.js");

module.exports = {
  name: "New Deployment (Instant)",
  description: "Triggers when a new deployment is created",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    vercel,
    projectName: {
      propDefinition: [
        vercel,
        "projectName",
      ],
    },
    http: "$.interface.http",
    db: "$.service.db",
  },
  hooks: {
    async activate() {
      const events = [
        "deployment",
      ];
      const hookParams = {
        url: this.http.endpoint,
        events,
      };
      const opts = {
        projectName: this.projectName,
        hookParams,
      };
      const { hookId } = await this.vercel.createHook(opts);
      console.log(
        `Created "deployment" webhook for project ${this.projectName}.
        (Hook ID: ${hookId}, endpoint: ${hookParams.url})`,
      );
      this.db.set("hookId", hookId);
    },
    async deactivate() {
      const hookId = this.db.get("hookId");
      const opts = {
        hookId,
      };
      await this.vercel.deleteHook(opts);
      console.log(
        `Deleted webhook for project ${this.projectName}.
        (Hook ID: ${hookId})`,
      );
    },
  },
  methods: {
    generateMeta(body) {
      const { createdAt } = body;
      const {
        deploymentId,
        name,
      } = body.payload;
      const summary = `New deployment: ${name}`;
      return {
        id: deploymentId,
        summary,
        ts: createdAt,
      };
    },
  },
  async run(event) {
    // Acknowledge the event back to Vercel.
    this.http.respond({
      status: 200,
    });

    const { body } = event;
    const opts = {
      body,
      projectName: this.projectName,
    };
    if (this.vercel.isEventForThisProject(opts)) {
      const meta = this.generateMeta(body);
      this.$emit(body, meta);
    }
  },
};
