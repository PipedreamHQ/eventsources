const newFilesInstant = require("../../../google_drive/sources/new-files-instant/new-files-instant.js");

module.exports = {
  ...newFilesInstant,
  key: "google_sheets-new-spreadsheet",
  name: "New Spreadsheet (Instant)",
  description:
    "Emits an event each time a new spreadsheet is created in a drive.",
  version: "0.0.3",
  methods: {
    ...newFilesInstant.methods,
    shouldProcess(file) {
      return (
        file.mimeType.includes("spreadsheet") &&
        newFilesInstant.methods.shouldProcess.bind(this)(file)
      );
    },
  },
};
