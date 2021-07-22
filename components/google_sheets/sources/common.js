const { v4: uuid } = require("uuid");
const googleSheets = require("../google_sheets.app");

/**
 * The number of events that will be automatically sent whenever the event
 * source is setup and deployed for the first time.
 *
 * Note that the event source could send less initial events than this if the
 * associated worksheets do not contain enough data.
 */
const INITIAL_EVENT_COUNT = 10;

module.exports = {
  props: {
    googleSheets,
    db: "$.service.db",
    http: "$.interface.http",
    timer: {
      label: "Push notification renewal schedule",
      description:
        "The Google Drive API requires occasionally renewal of push notification subscriptions. **This runs in the background, so you should not need to modify this schedule**.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 30, // 30 minutes
      },
    },
    watchedDrive: {
      propDefinition: [
        googleSheets,
        "watchedDrive",
      ],
    },
  },
  hooks: {
    async deploy() {
      await this.takeSheetSnapshot(INITIAL_EVENT_COUNT);

      const sheetId = this.getSheetId();
      const spreadsheet = await this.googleSheets.getSpreadsheet(sheetId);
      await this.processSpreadsheet(spreadsheet);
    },
    /**
     * Called when a component is created or updated. Handles all the logic
     * for starting and stopping watch notifications tied to the desired files.
     */
    async activate() {
      const channelID = this._getChannelID() || uuid();
      const driveId = this.getDriveId();

      const startPageToken = await this.googleSheets.getPageToken(driveId);
      const {
        expiration,
        resourceId,
      } = await this.googleSheets.watchDrive(
        channelID,
        this.http.endpoint,
        startPageToken,
        driveId,
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

      await this.takeSheetSnapshot();
    },
    async deactivate() {
      const channelID = this.db.get("channelID");
      const subscription = this.db.get("subscription");

      // Reset DB state before anything else
      this._setSubscription(null);
      this._setChannelID(null);
      this._setPageToken(null);

      if (!channelID) {
        console.log(
          "Channel not found, cannot stop notifications for non-existent channel",
        );
        return;
      }

      if (!subscription || !subscription.resourceId) {
        console.log(
          "No resource ID found, cannot stop notifications for non-existent resource",
        );
        return;
      }

      await this.googleSheets.stopNotifications(
        channelID,
        subscription.resourceId,
      );
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
    async getAllWorksheetIds(sheetID) {
      const { sheets } = await this.googleSheets.getSpreadsheet(sheetID);
      return sheets
        .map(({ properties }) => properties)
        .filter(({ sheetType }) => sheetType === "GRID")
        .map(({ sheetId }) => (sheetId.toString()));
    },
    async getModifiedSheet(pageToken, driveId, sheetID) {
      const changedFilesStream = this.googleSheets.getChanges(pageToken, driveId);
      for await (const changedFilesPage of changedFilesStream) {
        const {
          changedFiles,
          newStartPageToken = pageToken,
        } = changedFilesPage;
        this._setPageToken(newStartPageToken);

        const file = changedFiles
          .filter((file) => file.mimeType.includes("spreadsheet"))
          .filter((file) => sheetID === file.id)
          .shift();

        if (file) {
          // One of the changed files is the one that the event source is
          // watching, so we can stop going through the list of changed files
          // and return the file reference at this point
          return file;
        }
      }
    },
    async getSpreadsheetToProcess(event) {
      const { headers } = event;
      const subscription = this._getSubscription();
      const channelID = this._getChannelID();
      if (!this.googleSheets.checkHeaders(headers, subscription, channelID)) {
        return;
      }

      const pageToken = this._getPageToken();
      const driveId = this.getDriveId();
      const sheetId = this.getSheetId();
      const file = await this.getModifiedSheet(
        pageToken,
        driveId,
        sheetId,
      );

      if (!file) {
        console.log("No sheets were modified");
        return;
      }

      return this.googleSheets.getSpreadsheet(sheetId);
    },
    getDriveId() {
      return this.watchedDrive === "myDrive" ?
        null :
        this.watchedDrive;
    },
    getSheetId() {
      throw new Error("getSheetId is not implemented");
    },
    getWorksheetIds() {
      throw new Error("getWorksheetIds is not implemented");
    },
    isEventRelevant(event) {
      const { headers } = event;
      return headers["x-goog-resource-state"] !== "sync";
    },
    isWorksheetRelevant(worksheetId) {
      const worksheetIds = this.getWorksheetIds();
      return worksheetIds.includes(worksheetId.toString());
    },
    processSpreadsheet() {
      throw new Error("processEvent is not implemented");
    },
    async renewSubscription() {
      const driveId = this.getDriveId();

      // Assume subscription, channelID, and pageToken may all be undefined at
      // this point Handle their absence appropriately.
      const subscription = this._getSubscription();
      const channelID = this._getChannelID() || uuid();
      const pageToken =
        this._getPageToken() ||
        (await this.googleSheets.getPageToken(driveId));

      const {
        expiration,
        resourceId,
      } = await this.googleSheets.checkResubscription(
        subscription,
        channelID,
        pageToken,
        this.http.endpoint,
        this.watchedDrive,
      );

      this._setSubscription({
        expiration,
        resourceId,
      });
      this._setPageToken(pageToken);
      this._setChannelID(channelID);
    },
    /**
     * This method scans the worksheets indicated by the user to retrieve the
     * current row count of each one, and cache those values.
     * @param {number} [offset=0] When present, the row count that gets cached
     * will be reduced by this amount (useful for example to force an event
     * source to interpret the last rows as new).
     */
    takeSheetSnapshot() {
      throw new Error("takeSheetSnapshot is not implemented");
    },
  },
  async run(event) {
    if (event.timestamp) {
      // Component was invoked by timer
      return this.renewSubscription();
    }

    if (!this.isEventRelevant(event)) {
      console.log("Sync notification, exiting early");
      return;
    }

    const spreadsheet = await this.getSpreadsheetToProcess(event);
    if (!spreadsheet) {
      const sheetId = this.getSheetId();
      console.log(`Spreadsheet "${sheetId}" was not modified. Skipping event`);
      return;
    }
    return this.processSpreadsheet(spreadsheet);
  },
};
