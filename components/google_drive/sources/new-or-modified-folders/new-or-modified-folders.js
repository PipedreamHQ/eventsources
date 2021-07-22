// This source processes changes to any files in a user's Google Drive,
// implementing strategy enumerated in the Push Notifications API docs:
// https://developers.google.com/drive/api/v3/push and here:
// https://developers.google.com/drive/api/v3/manage-changes
//
// This source has two interfaces:
//
// 1) The HTTP requests tied to changes in the user's Google Drive
// 2) A timer that runs on regular intervals, renewing the notification channel as needed

const common = require("../common-webhook.js");
const {
  GOOGLE_DRIVE_NOTIFICATION_ADD,
  GOOGLE_DRIVE_NOTIFICATION_CHANGE,
  GOOGLE_DRIVE_NOTIFICATION_UPDATE,
} = require("../../constants");

module.exports = {
  ...common,
  key: "google_drive-new-or-modified-folders",
  name: "New or Modified Folders",
  description:
    "Emits a new event any time any folder in your linked Google Drive is added, modified, or deleted",
  version: "0.0.2",
  // Dedupe events based on the "x-goog-message-number" header for the target channel:
  // https://developers.google.com/drive/api/v3/push#making-watch-requests
  dedupe: "unique",
  methods: {
    ...common.methods,
    _getLastModifiedTimeForFile(fileId) {
      return this.db.get(fileId);
    },
    _setModifiedTimeForFile(fileId, modifiedTime) {
      this.db.set(fileId, modifiedTime);
    },
    getUpdateTypes() {
      return [
        GOOGLE_DRIVE_NOTIFICATION_ADD,
        GOOGLE_DRIVE_NOTIFICATION_CHANGE,
        GOOGLE_DRIVE_NOTIFICATION_UPDATE,
      ];
    },
    generateMeta(data, ts) {
      const {
        id: fileId,
        name: summary,
      } = data;
      return {
        id: `${fileId}-${ts}`,
        summary,
        ts,
      };
    },
    async processChanges(changedFiles, headers) {
      const files = changedFiles.filter(
        // API docs that define Google Drive folders:
        // https://developers.google.com/drive/api/v3/folder
        (file) => file.mimeType === "application/vnd.google-apps.folder",
      );

      for (const file of files) {
        // The changelog is updated each time a folder is opened. Check the
        // folder's `modifiedTime` to see if the folder has been modified.
        const fileInfo = await this.googleDrive.getFile(file.id);

        const lastModifiedTimeForFile = this._getLastModifiedTimeForFile(file.id);
        const modifiedTime = Date.parse(fileInfo.modifiedTime);
        if (lastModifiedTimeForFile == modifiedTime) continue;

        const eventToEmit = {
          file,
          change: {
            state: headers["x-goog-resource-state"],
            resourceURI: headers["x-goog-resource-uri"],
            changed: headers["x-goog-changed"], // "Additional details about the changes. Possible values: content, parents, children, permissions"
          },
        };
        const meta = this.generateMeta(file, modifiedTime);
        this.$emit(eventToEmit, meta);

        this._setModifiedTimeForFile(file.id, modifiedTime);
      }
    },
  },
};
