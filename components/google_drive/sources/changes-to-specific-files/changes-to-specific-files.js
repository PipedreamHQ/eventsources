// This source processes changes to specific files in a user's Google Drive,
// implementing strategy enumerated in the Push Notifications API docs:
// https://developers.google.com/drive/api/v3/push .
//
// This source has two interfaces:
//
// 1) The HTTP requests tied to changes in the user's Google Drive
// 2) A timer that runs on regular intervals, renewing the notification channel as needed

const cronParser = require("cron-parser");
const includes = require("lodash/includes");
const { v4: uuid } = require("uuid");

const googleDrive = require("../../google_drive.app.js");
const common = require("../common-webhook.js");

module.exports = {
  ...common,
  key: "google_drive-changes-to-specific-files",
  name: "Changes to Specific Files",
  description:
    "Watches for changes to specific files, emitting an event any time a change is made to one of those files",
  version: "0.0.11",
  // Dedupe events based on the "x-goog-message-number" header for the target channel:
  // https://developers.google.com/drive/api/v3/push#making-watch-requests
  dedupe: "unique",
  props: {
    ...common.props,
    files: {
      type: "string[]",
      label: "Files",
      description: "The files you want to watch for changes.",
      optional: true,
      default: [],
      options({ prevContext }) {
        const { nextPageToken } = prevContext;
        const baseOpts = {};
        const opts = this.drive === "myDrive"
          ? baseOpts
          : {
            ...baseOpts,
            corpora: "drive",
            driveId: this.drive,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
          };
        return this.googleDrive.listFilesOptions(nextPageToken, opts);
      },
    },
    updateTypes: {
      propDefinition: [
        googleDrive,
        "updateTypes",
      ],
    },
  },
  hooks: {
    ...common.hooks,
    async activate() {
      // Called when a component is created or updated. Handles all the logic
      // for starting and stopping watch notifications tied to the desired
      // files.

      // You can pass the same channel ID in watch requests for multiple files, so
      // our channel ID is fixed for this component to simplify the state we have to
      // keep track of.
      const channelID = this.db.get("channelID") || uuid();

      // Subscriptions are keyed on Google's resourceID, "an opaque value that
      // identifies the watched resource". This value is included in request
      // headers, allowing us to look up the watched resource.
      let subscriptions = this.db.get("subscriptions") || {};

      for (const fileID of this.files) {
        const {
          expiration,
          resourceId,
        } = await this.googleDrive.watchFile(
          channelID,
          this.http.endpoint,
          fileID,
        );
        // The fileID must be kept with the subscription metadata so we can
        // renew the watch request for this specific file when it expires.
        subscriptions[resourceId] = {
          expiration,
          fileID,
        };
      }

      // Save metadata on the subscription so we can stop / renew later
      this.db.set("subscriptions", subscriptions);
      this.db.set("channelID", channelID);
    },
    async deactivate() {
      const channelID = this.db.get("channelID");
      if (!channelID) {
        console.log(
          "Channel not found, cannot stop notifications for non-existent channel",
        );
        return;
      }

      const subscriptions = this.db.get("subscriptions") || {};
      for (const resourceId of Object.keys(subscriptions)) {
        await this.googleDrive.stopNotifications(channelID, resourceId);
      }

      // Reset DB state
      this.db.set("subscriptions", {});
      this.db.set("channelID", null);
    },
  },
  methods: {
    ...common.methods,
    _getNextTimerEventTimestamp(event) {
      if (event.cron) {
        return cronParser
          .parseExpression(event.cron)
          .next()
          .getTime();
      }
      if (event.interval_seconds) {
        return Date.now() + event.interval_seconds * 1000;
      }
    },
    getUpdateTypes() {
      return this.updateTypes;
    },
  },
  async run(event) {
    // This function is polymorphic: it can be triggered as a cron job, to make sure we renew
    // watch requests for specific files, or via HTTP request (the change payloads from Google)

    let subscriptions = this.db.get("subscriptions") || {};
    const channelID = this.db.get("channelID");

    // Component was invoked by timer
    if (event.timestamp) {
      for (const [
        currentResourceId,
        metadata,
      ] of Object.entries(subscriptions)) {
        const { fileID } = metadata;
        // If the subscription for this resource will expire before the next run,
        // stop the existing subscription and renew
        if (metadata.expiration < this._getNextTimerEventTimestamp(event)) {
          console.log(
            `Notifications for resource ${currentResourceId} are expiring at ${metadata.expiration}. Renewing`,
          );
          await this.googleDrive.stopNotifications(
            channelID,
            currentResourceId,
          );
          const {
            expiration,
            resourceId,
          } = await this.googleDrive.watchFile(
            channelID,
            this.http.endpoint,
            fileID,
          );
          subscriptions[resourceId] = {
            expiration,
            fileID,
          };
        }
      }

      this.db.set("subscriptions", subscriptions);
      return;
    }

    const { headers } = event;

    if (
      !headers["x-goog-resource-state"] ||
      !headers["x-goog-resource-id"] ||
      !headers["x-goog-resource-uri"] ||
      !headers["x-goog-message-number"]
    ) {
      console.log("Request missing necessary headers: ", headers);
      return;
    }

    const incomingChannelID = headers["x-goog-channel-id"];
    if (incomingChannelID !== channelID) {
      console.log(
        `Channel ID of ${incomingChannelID} not equal to deployed component channel of ${channelID}`,
      );
      return;
    }

    if (subscriptions[headers["x-goog-resource-id"]] === undefined) {
      console.log(
        `Resource ID of ${headers["x-goog-resource-id"]} not currently being tracked. Exiting`,
      );
      return;
    }

    if (!includes(this.updateTypes, headers["x-goog-resource-state"])) {
      console.log(
        `Update type ${headers["x-goog-resource-state"]} not in list of updates to watch: `,
        this.updateTypes,
      );
      return;
    }

    // We observed false positives where a single change to a document would trigger two changes:
    // one to "properties" and another to "content,properties". But changes to properties
    // alone are legitimate, most users just won't want this source to emit in those cases.
    // If x-goog-changed is _only_ set to "properties", only move on if the user set the prop
    if (
      !this.watchForPropertiesChanges &&
      headers["x-goog-changed"] === "properties"
    ) {
      console.log(
        "Change to properties only, which this component is set to ignore. Exiting",
      );
      return;
    }

    const file = await this.googleDrive.getFileMetadata(
      headers["x-goog-resource-uri"],
    );

    if (!file || !Object.keys(file).length) {
      console.log("No file metadata returned, nothing to emit");
      return;
    }

    const eventToEmit = {
      file,
      change: {
        state: headers["x-goog-resource-state"],
        resourceURI: headers["x-goog-resource-uri"],
        changed: headers["x-goog-changed"], // "Additional details about the changes. Possible values: content, parents, children, permissions"
      },
    };

    this.$emit(eventToEmit, {
      summary: `${headers["x-goog-resource-state"].toUpperCase()} - ${
        file.name || "Untitled"
      }`,
      id: headers["x-goog-message-number"],
    });
  },
};
