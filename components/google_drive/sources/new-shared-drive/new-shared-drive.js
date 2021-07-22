const googleDrive = require("../../google_drive.app.js");

module.exports = {
  key: "google_drive-new-shared-drive",
  name: "New Shared Drive",
  description: "Emits a new event any time a shared drive is created.",
  version: "0.0.2",
  dedupe: "unique",
  props: {
    googleDrive,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15, // 30 minutes
      },
    },
  },
  hooks: {
    async deploy() {
      const { drives: initDrives } = await this.googleDrive.listDrivesInPage();
      for (const drive of initDrives) {
        const newDrive = await this.googleDrive.getDrive(drive.id);
        const meta = this.generateMeta(newDrive);
        this.$emit(newDrive, meta);
      }

      this._setKnownDrives(initDrives.map((drive) => drive.id));
    },
  },
  methods: {
    _getKnownDrives() {
      return this.db.get("driveIds");
    },
    _setKnownDrives(driveIds) {
      this.db.set("driveIds", Array.from(driveIds));
    },
    generateMeta(drive) {
      const ts = new Date(drive.createdTime).getTime();
      return {
        id: drive.id,
        summary: drive.name,
        ts,
      };
    },
  },
  async run() {
    const knownDrives = new Set(this._getKnownDrives());
    const drivesStream = this.googleDrive.listDrives();
    for await (const drive of drivesStream) {
      if (knownDrives.has(drive.id)) {
        // We've already seen this drive, so we skip it
        continue;
      }

      knownDrives.add(drive.id);

      const newDrive = await this.googleDrive.getDrive(drive.id);
      const meta = this.generateMeta(newDrive);
      this.$emit(newDrive, meta);
    }

    this._setKnownDrives(knownDrives);
  },
};
