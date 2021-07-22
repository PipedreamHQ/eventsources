const googleDrive = require("../google_drive.app.js");
const includes = require("lodash/includes");
const { v4: uuid } = require("uuid");

module.exports = {
  props: {
    googleDrive,
    db: "$.service.db",
    http: "$.interface.http",
    drive: {
      propDefinition: [
        googleDrive,
        "watchedDrive",
      ],
    },
    watchForPropertiesChanges: {
      propDefinition: [
        googleDrive,
        "watchForPropertiesChanges",
      ],
    },
    timer: {
      label: "Push notification renewal schedule",
      description:
        "The Google Drive API requires occasional renewal of push notification subscriptions. **This runs in the background, so you should not need to modify this schedule**.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 30, // 30 minutes
      },
    },
  },
  hooks: {
    async activate() {
      // Called when a component is created or updated. Handles all the logic
      // for starting and stopping watch notifications tied to the desired
      // files.
      const channelID = uuid();
      const {
        startPageToken,
        expiration,
        resourceId,
      } = await this.googleDrive.activateHook(
        channelID,
        this.http.endpoint,
        this.drive === "myDrive"
          ? null
          : this.drive,
      );

      // We use and increment the pageToken as new changes arrive, in run()
      this._setPageToken(startPageToken);

      // Save metadata on the subscription so we can stop / renew later
      // Subscriptions are tied to Google's resourceID, "an opaque value that
      // identifies the watched resource". This value is included in request headers
      this._setSubscription({
        resourceId,
        expiration,
      });
      this._setChannelID(channelID);
    },
    async deactivate() {
      const channelID = this._getChannelID();
      const { resourceId } = this._getSubscription();
      await this.googleDrive.deactivateHook(channelID, resourceId);

      this._setSubscription(null);
      this._setChannelID(null);
      this._setPageToken(null);
    },
  },
  methods: {
    _getSubscription() {
      return this.db.get("subscription");
    },
    _setSubscription(subscription) {
      this.db.set("subscription", subscription);
    },
    _getChannelID() {
      return this.db.get("channelID");
    },
    _setChannelID(channelID) {
      this.db.set("channelID", channelID);
    },
    _getPageToken() {
      return this.db.get("pageToken");
    },
    _setPageToken(pageToken) {
      this.db.set("pageToken", pageToken);
    },
    /**
     * This method returns the types of updates/events from Google Drive that
     * the event source should listen to. This base implementation returns an
     * empty list, which means that any event source that extends this module
     * and that does not refine this implementation will essentially ignore
     * every incoming event from Google Drive.
     *
     * @returns
     * @type {UpdateType[]}
     */
    getUpdateTypes() {
      return [];
    },
    /**
     * This method is responsible for processing a list of changed files
     * according to the event source's purpose. As an abstract method, it must
     * be implemented by every event source that extends this module.
     *
     * @param {object[]} [changedFiles] - the list of file changes, as [defined
     * by the API](https://bit.ly/3h7WeUa)
     * @param {object} [headers] - an object containing the request headers of
     * the webhook call made by Google Drive
     */
    processChanges() {
      throw new Error("processChanges is not implemented");
    },
  },
  async run(event) {
    // This function is polymorphic: it can be triggered as a cron job, to make
    // sure we renew watch requests for specific files, or via HTTP request (the
    // change payloads from Google)
    const subscription = this._getSubscription();
    const channelID = this._getChannelID();
    const pageToken = this._getPageToken();

    // Component was invoked by timer
    if (event.timestamp) {
      const {
        newChannelID,
        newPageToken,
        expiration,
        resourceId,
      } = await this.googleDrive.invokedByTimer(
        this.drive,
        subscription,
        this.http.endpoint,
        channelID,
        pageToken,
      );

      this._setSubscription({
        expiration,
        resourceId,
      });
      this._setChannelID(newChannelID);
      this._setPageToken(newPageToken);
      return;
    }

    const { headers } = event;
    if (!this.googleDrive.checkHeaders(headers, subscription, channelID)) {
      return;
    }

    if (!includes(this.getUpdateTypes(), headers["x-goog-resource-state"])) {
      console.log(
        `Update type ${headers["x-goog-resource-state"]} not in list of updates to watch: `,
        this.getUpdateTypes(),
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

    const driveId = this.drive === "myDrive"
      ? null
      : this.drive;
    const changedFilesStream = this.googleDrive.listChanges(pageToken, driveId);
    for await (const changedFilesPage of changedFilesStream) {
      const {
        changedFiles,
        nextPageToken,
      } = changedFilesPage;

      // Process all the changed files retrieved from the current page
      await this.processChanges(changedFiles, headers);

      // After successfully processing the changed files, we store the page
      // token of the next page
      this._setPageToken(nextPageToken);
    }
  },
};
