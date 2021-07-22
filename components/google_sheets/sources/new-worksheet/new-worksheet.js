const common = require("../common");

module.exports = {
  ...common,
  key: "google_sheets-new-worksheet",
  name: "New Worksheet (Instant)",
  description:
    "Emits an event each time a new worksheet is created in a spreadsheet.",
  version: "0.0.3",
  dedupe: "unique",
  props: {
    ...common.props,
    sheetID: {
      propDefinition: [
        common.props.googleSheets,
        "sheetID",
        (c) => ({
          driveId: c.watchedDrive === "myDrive" ?
            null :
            c.watchedDrive,
        }),
      ],
    },
  },
  hooks: {
    ...common.hooks,
    async deploy() {
      await this.processSpreadsheet({
        spreadsheetId: this.sheetID,
      });
    },
  },
  methods: {
    ...common.methods,
    generateMeta(worksheet) {
      return {
        id: worksheet.properties.sheetId,
        summary: worksheet.properties.title,
        ts: Date.now(),
      };
    },
    /**
     * Temporary transformation to ensure the format of the data is the
     * correct one. This will be fixed in the UI and backend, so that the data
     * format is guaranteed to be the one indicated in the `type` field of the
     * user prop.
     */
    getSheetId() {
      return this.sheetID.toString();
    },
    _getWorksheetIds() {
      return this.db.get("worksheetIds");
    },
    _setWorksheetIds(worksheetIds) {
      this.db.set("worksheetIds", worksheetIds);
    },
    async processSpreadsheet({ spreadsheetId }) {
      const { sheets: worksheets } = await this.googleSheets.getSpreadsheet(
        spreadsheetId,
      );
      let worksheetIds = this._getWorksheetIds() || [];
      for (const worksheet of worksheets) {
        if (worksheetIds.includes(worksheet.properties.sheetId)) continue;
        worksheetIds.push(worksheet.properties.sheetId);
        const meta = this.generateMeta(worksheet);
        this.$emit(worksheet, meta);
      }
      this._setWorksheetIds(worksheetIds);
    },
    takeSheetSnapshot() {},
  },
};
