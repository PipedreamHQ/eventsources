const axios = require("axios");
const { google } = require("googleapis");
const { uuid } = require("uuidv4");

const GOOGLE_DRIVE_UPDATE_TYPES = [
  "add",
  "sync",
  "remove",
  "update",
  "trash",
  "untrash",
  "change",
];

module.exports = {
  type: "app",
  app: "google_drive",
  propDefinitions: {
    watchedDrive: {
      type: "string",
      label: "Drive",
      description: "The drive you want to watch for changes",
      async options({ prevContext }) {
        const { nextPageToken } = prevContext;
        return this.listDrives(nextPageToken);
      },
    },
    updateTypes: {
      type: "string[]",
      label: "Types of updates",
      description:
        "The types of updates you want to watch for on these files. [See Google's docs](https://developers.google.com/drive/api/v3/push#understanding-drive-api-notification-events).",
      // https://developers.google.com/drive/api/v3/push#understanding-drive-api-notification-events
      default: GOOGLE_DRIVE_UPDATE_TYPES,
      options: GOOGLE_DRIVE_UPDATE_TYPES,
    },
    watchForPropertiesChanges: {
      type: "boolean",
      label: "Watch for changes to file properties",
      description:
        "Watch for changes to [file properties](https://developers.google.com/drive/api/v3/properties) in addition to changes to content. **Defaults to `false`, watching for only changes to content**.",
      optional: true,
      default: false,
    },
  },
  methods: {
    // Returns a drive object authenticated with the user's access token
    drive() {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({
        access_token: this.$auth.oauth_access_token,
      });
      return google.drive({
        version: "v3",
        auth,
      });
    },
    // Google's push notifications provide a URL to the resource that changed,
    // which we can use to fetch the file's metadata. So we use axios here
    // (vs. the Node client) to get that.
    async getFileMetadata(url) {
      return (
        await axios({
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.$auth.oauth_access_token}`,
          },
          url,
        })
      ).data;
    },
    async getChanges(pageToken, driveId) {
      const drive = this.drive();
      // As with many of the methods for Google Drive, we must
      // pass a request of a different shape when we're requesting
      // changes for My Drive (null driveId) vs. a shared drive
      let changeRequest;
      if (driveId) {
        changeRequest = {
          driveId,
          pageToken,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
        };
      } else {
        changeRequest = {
          pageToken,
        };
      }
      const {
        changes,
        newStartPageToken,
      } = (
        await drive.changes.list(changeRequest)
      ).data;

      // Some changes do not include an associated file object. Return only those that do
      const changedFiles = changes
        .map((change) => change.file)
        .filter((f) => typeof f === "object");

      return {
        changedFiles,
        newStartPageToken,
      };
    },
    async getPageToken(driveId) {
      const drive = this.drive();
      const request = driveId
        ? {
          driveId,
          supportsAllDrives: true,
        }
        : {};
      const { data } = await drive.changes.getStartPageToken(request);
      return data.startPageToken;
    },
    checkHeaders(headers, subscription, channelID) {
      if (
        !headers["x-goog-resource-state"] ||
        !headers["x-goog-resource-id"] ||
        !headers["x-goog-resource-uri"] ||
        !headers["x-goog-message-number"]
      ) {
        console.log("Request missing necessary headers: ", headers);
        return false;
      }

      const incomingChannelID = headers["x-goog-channel-id"];
      if (incomingChannelID !== channelID) {
        console.log(
          `Channel ID of ${incomingChannelID} not equal to deployed component channel of ${channelID}`,
        );
        return false;
      }

      if (headers["x-goog-resource-id"] !== subscription.resourceId) {
        console.log(
          `Resource ID of ${subscription.resourceId} not currently being tracked. Exiting`,
        );
        return false;
      }
      return true;
    },
    async checkResubscription(
      subscription,
      channelID,
      pageToken,
      endpoint,
      driveId,
    ) {
      if (subscription && subscription.resourceId) {
        console.log(
          `Notifications for resource ${subscription.resourceId} are expiring at ${subscription.expiration}. Stopping existing sub`,
        );
        await this.stopNotifications(channelID, subscription.resourceId);
      }
      const {
        expiration,
        resourceId,
      } = await this.watchDrive(
        channelID,
        endpoint,
        pageToken,
        driveId === "myDrive"
          ? null
          : driveId,
      );
      return {
        expiration,
        resourceId,
      };
    },
    async listDrives(pageToken) {
      const drive = this.drive();
      const resp = await drive.drives.list({
        pageToken,
      });
      const {
        drives,
        nextPageToken,
      } = resp.data;
      // "My Drive" isn't returned from the list of drives,
      // so we add it to the list and assign it a static
      // ID that we can refer to when we need.
      const options = [
        {
          label: "My Drive",
          value: "myDrive",
        },
      ];
      for (const d of drives) {
        options.push({
          label: d.name,
          value: d.id,
        });
      }
      return {
        options,
        context: {
          nextPageToken,
        },
      };
    },
    async listFiles(opts) {
      const drive = this.drive();
      // Listing files in My Drive and a shared drive requires
      // mutually-exclusive options, so we accept an object of
      // opts from the caller and pass them to the list method.
      const resp = await drive.files.list(opts);
      const {
        files,
        nextPageToken,
      } = resp.data;
      const options = files.map((file) => {
        return {
          label: file.name,
          value: file.id,
        };
      });
      return {
        options,
        context: {
          nextPageToken,
        },
      };
    },
    async listComments(fileId, startModifiedTime = null) {
      const drive = this.drive();
      const opts = {
        fileId,
        fields: "*",
      };
      if (startModifiedTime) opts.startModifiedTime = startModifiedTime;
      return (await drive.comments.list(opts)).data;
    },
    _makeWatchRequestBody(id, address) {
      return {
        id, // the component-specific channel ID, a UUID
        type: "web_hook",
        address, // the component-specific HTTP endpoint
      };
    },
    async watchDrive(id, address, pageToken, driveId) {
      const drive = this.drive();
      const requestBody = this._makeWatchRequestBody(id, address);

      // Google expects an entirely different object to be passed
      // when you make a watch request for My Drive vs. a shared drive
      // "My Drive" doesn't have a driveId, so if this method is called
      // without a driveId, we make a watch request for My Drive
      let watchRequest;
      if (driveId) {
        watchRequest = {
          driveId,
          pageToken,
          requestBody,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
        };
      } else {
        watchRequest = {
          pageToken,
          requestBody,
        };
      }
      // When watching for changes to an entire account, we must pass a pageToken,
      // which points to the moment in time we want to start watching for changes:
      // https://developers.google.com/drive/api/v3/manage-changes
      const {
        expiration,
        resourceId,
      } = (
        await drive.changes.watch(watchRequest)
      ).data;
      console.log(`Watch request for drive successful, expiry: ${expiration}`);
      return {
        expiration: parseInt(expiration),
        resourceId,
      };
    },
    async watchFile(id, address, fileId) {
      const drive = this.drive();
      const requestBody = this._makeWatchRequestBody(id, address);
      const {
        expiration,
        resourceId,
      } = (
        await drive.files.watch({
          fileId,
          requestBody,
          supportsAllDrives: true,
        })
      ).data;
      console.log(
        `Watch request for file ${fileId} successful, expiry: ${expiration}`,
      );
      return {
        expiration: parseInt(expiration),
        resourceId,
      };
    },
    async stopNotifications(id, resourceId) {
      // id = channelID
      // See https://github.com/googleapis/google-api-nodejs-client/issues/627
      const drive = this.drive();

      // If for some reason the channel doesn't exist, this throws an error
      // It's OK for this to fail in those cases, since we'll renew the channel
      // immediately after trying to stop it if we still want notifications,
      // so we squash the error, log it, and move on.
      try {
        await drive.channels.stop({
          resource: {
            id,
            resourceId,
          },
        });
        console.log(`Stopped push notifications on channel ${id}`);
      } catch (err) {
        console.error(
          `Failed to stop channel ${id} for resource ${resourceId}: ${err}`,
        );
      }
    },
    async getFile(fileId) {
      const drive = this.drive();
      return (
        await drive.files.get({
          fileId,
          fields: "*",
        })
      ).data;
    },
    async getDrive(driveId) {
      const drive = this.drive();
      return (
        await drive.drives.get({
          driveId,
        })
      ).data;
    },
    async activateHook(channelID, url, drive) {
      const startPageToken = await this.getPageToken();
      const {
        expiration,
        resourceId,
      } = await this.watchDrive(
        channelID,
        url,
        startPageToken,
        drive,
      );
      return {
        startPageToken,
        expiration,
        resourceId,
      };
    },
    async deactivateHook(channelID, resourceId) {
      if (!channelID) {
        console.log(
          "Channel not found, cannot stop notifications for non-existent channel",
        );
        return;
      }

      if (!resourceId) {
        console.log(
          "No resource ID found, cannot stop notifications for non-existent resource",
        );
        return;
      }

      await this.stopNotifications(channelID, resourceId);
    },
    async invokedByTimer(drive, subscription, url, channelID, pageToken) {
      const newChannelID = channelID || uuid();
      const newPageToken =
        pageToken ||
        (await this.getPageToken(drive === "myDrive"
          ? null
          : drive));

      const {
        expiration,
        resourceId,
      } = await this.checkResubscription(
        subscription,
        newChannelID,
        newPageToken,
        url,
        drive,
      );

      return {
        newChannelID,
        newPageToken,
        expiration,
        resourceId,
      };
    },
  },
};
