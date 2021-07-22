/**
 * @typedef {string} UpdateType - a type of push notification as defined by
 * the [Google Drive API docs](https://bit.ly/3wcsY2X)
 */

/**
 * A new channel was successfully created. You can expect to start receiving
 * notifications for it.
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_SYNC = "sync";

/**
 * A new resource was created or shared
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_ADD = "add";

/**
 * An existing resource was deleted or unshared
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_REMOVE = "remove";

/**
 * One or more properties (metadata) of a resource have been updated
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_UPDATE = "update";

/**
 * A resource has been moved to the trash
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_TRASH = "trash";

/**
 * A resource has been removed from the trash
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_UNTRASH = "untrash";

/**
 * One or more new changelog items have been added
 *
 * @type {UpdateType}
 */
const GOOGLE_DRIVE_NOTIFICATION_CHANGE = "change";

/**
 * All the available Google Drive update types
 * @type {UpdateType[]}
 */
const GOOGLE_DRIVE_UPDATE_TYPES = [
  GOOGLE_DRIVE_NOTIFICATION_SYNC,
  GOOGLE_DRIVE_NOTIFICATION_ADD,
  GOOGLE_DRIVE_NOTIFICATION_REMOVE,
  GOOGLE_DRIVE_NOTIFICATION_UPDATE,
  GOOGLE_DRIVE_NOTIFICATION_TRASH,
  GOOGLE_DRIVE_NOTIFICATION_UNTRASH,
  GOOGLE_DRIVE_NOTIFICATION_CHANGE,
];

module.exports = {
  GOOGLE_DRIVE_NOTIFICATION_SYNC,
  GOOGLE_DRIVE_NOTIFICATION_ADD,
  GOOGLE_DRIVE_NOTIFICATION_REMOVE,
  GOOGLE_DRIVE_NOTIFICATION_UPDATE,
  GOOGLE_DRIVE_NOTIFICATION_TRASH,
  GOOGLE_DRIVE_NOTIFICATION_UNTRASH,
  GOOGLE_DRIVE_NOTIFICATION_CHANGE,
  GOOGLE_DRIVE_UPDATE_TYPES,
};
