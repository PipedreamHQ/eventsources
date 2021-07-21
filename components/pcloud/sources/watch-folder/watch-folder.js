const common = require("../../common");
const { pcloud } = common.props;
const get = require("lodash/get");

module.exports = {
  key: "pcloud-watch-folder",
  name: "Watch Folder",
  description:
    "Emits an event when a file is created or modified in the specified folder.",
  version: "0.0.1",
  dedupe: "dedupe",
  props: {
    pcloud,
    db: "$.service.db",
    timer: {
      label: "Polling schedule",
      description: "Pipedream polls Reddit for events on this schedule.",
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15, // by default, run every 15 minutes.
      },
    },
    domainLocation: { propDefinition: [pcloud, "domainLocation"] },
    folderPath: {
      type: "string",
      label: "Folder Path",
      description:
        "Path to the folder you'd like to watch for created or modified files. For example:  `/My Documents/Work`",
    },
    emmitOn: {
      type: "string",
      label: "Emmit events on Created or Modified files?",
      options: ["Created", "Modified"],
      description:
        "When you'd like an event to be emitted, by checking on the file's created or modified timestamps. Note: When you manually upload files on pCloud, the file originals's `created` and `modified` timestamps are preserved. When using pCloud API's `uploadfile` endpoint, these fields can be set by specifying the `mtime` and `ctime` parameters.",
      default: "Created",
    },
    showdeleted: {
      type: "boolean",
      label: "Show Deleted?",
      description:
        "If is set, deleted files that can be undeleted will be displayed.",
      default: false,
    },
  },
  hooks: {
    async deploy() {
      const files = [];
      const pCloudContentsData = await this.pcloud.listContents(
        this.domainLocation,
        this.folderPath,
        undefined,
        undefined,
        this.showDeleted ? 1 : undefined,
        undefined,
        undefined
      );
      const hasContents = get(pCloudContentsData, ["metadata", "contents"]);
      if (hasContents) {
        for (const folderItem of pCloudContentsData.metadata.contents) {
          if (!folderItem.isfolder) {
            files.push(folderItem);
            if (files.length == 10) {
              break;
            }
          }
        }
      } else {
        console.log("No data available, skipping iteration");
      }
      files.forEach(this.emitpCloudEvent);
      this.db.set("lastPolledTime", +Date.now());
    },
  },
  methods: {
    emitpCloudEvent(pCloudEvent) {
      const metadata = this.getEventData(pCloudEvent);
      this.$emit(pCloudEvent, metadata);
    },
    getEventData(pcloudEvent) {
      const newOrModified = ["Created"].includes(this.emmitOn)
        ? "New created"
        : "Modified";
      const eventDate = ["Created"].includes(this.emmitOn)
        ? pcloudEvent.created
        : pcloudEvent.modified;
      return {
        id: pcloudEvent.fileid,
        summary: `${newOrModified} file "${pcloudEvent.name}"`,
        ts: +new Date(eventDate),
      };
    },
  },
  async run() {
    const lastPolledTime = this.db.get("lastPolledTime");
    const files = [];
    const pCloudContentsData = await this.pcloud.listContents(
      this.domainLocation,
      this.folderPath,
      undefined,
      undefined,
      this.showDeleted ? 1 : undefined,
      undefined,
      undefined
    );
    const hasContents = get(pCloudContentsData, ["metadata", "contents"]);
    if (hasContents) {
      for (const folderItem of pCloudContentsData.metadata.contents) {
        if (!folderItem.isfolder) {
          let fileTime;
          if (["Created"].includes(this.emmitOn)) {
            fileTime = +new Date(folderItem.created);
          } else {
            fileTime = +new Date(folderItem.modified);
          }
          if (fileTime > lastPolledTime) {
            files.push(folderItem);
          }
        }
      }
    } else {
      console.log("No data available, skipping iteration");
    }
    files.forEach(this.emitpCloudEvent);
    this.db.set("lastPolledTime", +Date.now());
  },
};
