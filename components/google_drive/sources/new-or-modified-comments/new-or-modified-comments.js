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
const { GOOGLE_DRIVE_NOTIFICATION_CHANGE } = require("../../constants");

module.exports = {
  ...common,
  key: "google_drive-new-or-modified-comments",
  name: "New or Modified Comments",
  description:
    "Emits a new event any time a file comment is added, modified, or deleted in your linked Google Drive",
  version: "0.0.2",
  // Dedupe events based on the "x-goog-message-number" header for the target channel:
  // https://developers.google.com/drive/api/v3/push#making-watch-requests
  dedupe: "unique",
  hooks: {
    ...common.hooks,
    async activate() {
      await common.hooks.activate.bind(this)();
      this._setInitTime(Date.now());
    },
    async deactivate() {
      await common.hooks.deactivate.bind(this)();
      this._setInitTime(null);
    },
  },
  methods: {
    ...common.methods,
    _getInitTime() {
      return this.db.get("initTime");
    },
    _setInitTime(initTime) {
      this.db.set("initTime", initTime);
    },
    _getLastCommentTimeForFile(fileId) {
      return this.db.get(fileId) || this._getInitTime();
    },
    _updateLastCommentTimeForFile(fileId, commentTime) {
      this.db.set(fileId, commentTime);
    },
    getUpdateTypes() {
      return [
        GOOGLE_DRIVE_NOTIFICATION_CHANGE,
      ];
    },
    generateMeta(data, headers) {
      const {
        id: commentId,
        content: summary,
        modifiedTime: tsString,
      } = data;
      const { "x-goog-message-number": eventId } = headers;
      return {
        id: `${commentId}-${eventId}`,
        summary,
        ts: Date.parse(tsString),
      };
    },
    async processChanges(changedFiles, headers) {
      for (const file of changedFiles) {
        const lastCommentTimeForFile = this._getLastCommentTimeForFile(file.id);
        let maxModifiedTime = lastCommentTimeForFile;
        const commentsStream = this.googleDrive.listComments(
          file.id,
          lastCommentTimeForFile,
        );

        for await (const comment of commentsStream) {
          const commentTime = Date.parse(comment.modifiedTime);
          if (commentTime <= lastCommentTimeForFile) {
            continue;
          }

          const eventToEmit = {
            comment,
            file,
            change: {
              state: headers["x-goog-resource-state"],
              resourceURI: headers["x-goog-resource-uri"],

              // Additional details about the changes. Possible values: content,
              // parents, children, permissions.
              changed: headers["x-goog-changed"],
            },
          };
          const meta = this.generateMeta(comment, headers);
          this.$emit(eventToEmit, meta);

          maxModifiedTime = Math.max(maxModifiedTime, commentTime);
          this._updateLastCommentTimeForFile(file.id, maxModifiedTime);
        }
      }
    },
  },
};
