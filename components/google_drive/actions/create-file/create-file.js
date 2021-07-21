const googleDrive = require("../../google_drive.app");
const fs = require("fs");
const got = require("got");

module.exports = {
  key: "google_drive-create-file",
  name: "Create a New File",
  description: "Create a new file from a URL or /tmp/filepath.",
  version: "0.0.1",
  type: "action",
  props: {
    googleDrive,
    drive: {
      propDefinition: [
        googleDrive,
        "watchedDrive",
      ],
    },
    uploadType: {
      type: "string",
      label: "Upload Type",
      description: `The type of upload request to the /upload URI. If you are uploading data (using an /upload URI), this field is required. If you are creating a metadata-only file, this field is not required. 
        media - Simple upload. Upload the media only, without any metadata.
        multipart - Multipart upload. Upload both the media and its metadata, in a single request.
        resumable - Resumable upload. Upload the file in a resumable fashion, using a series of at least two requests where the first request includes the metadata.
      `,
      options: [
        "media",
        "multipart",
        "resumable",
      ],
    },
    fileUrl: {
      type: "string",
      label: "File URL",
      description:
        "The URL of the file you want to upload to Google Drive. Must specify either File URL or File Path.",
      optional: true,
    },
    filePath: {
      type: "string",
      label: "File Path",
      description:
        "The path to the file, e.g. /tmp/myFile.csv . Must specify either File URL or File Path.",
      optional: true,
    },
    ignoreDefaultVisibility: {
      type: "boolean",
      label: "Ignore Default Visibility",
      description: `Whether to ignore the domain's default visibility settings for the created file. Domain administrators can choose to make all uploaded files visible to the domain by default; this parameter bypasses that behavior for the request. Permissions are still inherited from parent folders. 
        (Default: false)
      `,
      optional: true,
    },
    includePermissionsForView: {
      type: "string",
      label: "Include Permissions For View",
      description:
        "Specifies which additional view's permissions to include in the response. Only 'published' is supported.",
      optional: true,
    },
    keepRevisionForever: {
      type: "boolean",
      label: "Keep Revision Forever",
      description:
        "Whether to set the 'keepForever' field in the new head revision. This is only applicable to files with binary content in Google Drive. Only 200 revisions for the file can be kept forever. If the limit is reached, try deleting pinned revisions. (Default: false)",
      optional: true,
    },
    ocrLanguage: {
      type: "string",
      label: "OCR Language",
      description:
        "A language hint for OCR processing during image import (ISO 639-1 code).",
      optional: true,
    },
    useContentAsIndexableText: {
      type: "boolean",
      label: "Use Content As Indexable Text",
      description:
        "Whether to use the uploaded content as indexable text. (Default: false)",
      optional: true,
    },
    supportsAllDrives: {
      type: "boolean",
      label: "Supports All Drives",
      description:
        "Whether to include shared drives. Set to 'true' if saving to a shared drive. Defaults to 'false' if left blank.",
      optional: true,
    },
    contentHintsIndexableText: {
      type: "string",
      label: "Content Hints Indexable Text",
      description:
        "Text to be indexed for the file to improve fullText queries. This is limited to 128KB in length and may contain HTML elements.",
      optional: true,
    },
    contentRestrictionsReadOnly: {
      type: "boolean",
      label: "Content Restrictions Read Only",
      description:
        "Whether the content of the file is read-only. If a file is read-only, a new revision of the file may not be added, comments may not be added or modified, and the title of the file may not be modified.",
      optional: true,
    },
    contentRestrictionsReason: {
      type: "string",
      label: "Content Restrictions Reason",
      description:
        "Reason for why the content of the file is restricted. This is only mutable on requests that also set readOnly=true.",
      optional: true,
    },
    copyRequiresWriterPermission: {
      type: "boolean",
      label: "Copy Requires Writer Permission",
      description:
        "Whether the options to copy, print, or download this file, should be disabled for readers and commenters.",
      optional: true,
    },
    description: {
      type: "string",
      label: "Description",
      description: "A short description of the file.",
      optional: true,
    },
    folderColorRgb: {
      type: "string",
      label: "Folder Color RGB",
      description:
        "The color for a folder as an RGB hex string. If an unsupported color is specified, the closest color in the palette will be used instead.",
      optional: true,
    },
    mimeType: {
      type: "string",
      label: "Mime Type",
      description: `The MIME type of the file. Google Drive will attempt to automatically detect an appropriate value from uploaded content if no value is provided. The value cannot be changed unless a new revision is uploaded. If a file is created with a Google Doc MIME type, the uploaded content will be imported if possible. 
        Google Workspace and Drive MIME Types: https://developers.google.com/drive/api/v3/mime-types
      `,
      optional: true,
    },
    name: {
      type: "string",
      label: "Name",
      description: "Name of the file",
      optional: true,
    },
    originalFilename: {
      type: "string",
      label: "Original Filename",
      description:
        "The original filename of the uploaded content if available, or else the original value of the name field. This is only available for files with binary content in Google Drive.",
      optional: true,
    },
    parents: {
      type: "string",
      label: "Parent Folder",
      description:
        "The ID of the parent folder which contain the file. If not specified as part of a create request, the file will be placed directly in the user's My Drive folder.",
      optional: true,
      async options({ prevContext }) {
        const { nextPageToken } = prevContext;
        let results;
        if (this.drive === "myDrive") {
          results = await this.googleDrive.listFiles({
            pageToken: nextPageToken,
            q: "mimeType = 'application/vnd.google-apps.folder'",
          });
        } else {
          results = await this.googleDrive.listFiles({
            pageToken: nextPageToken,
            corpora: "drive",
            driveId: this.drive,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            q: "mimeType = 'application/vnd.google-apps.folder'",
          });
        }
        return results;
      },
    },
    shortcutDetailsTargetId: {
      type: "string",
      label: "Shortcut Details Target ID",
      description: "The ID of the file that this shortcut points to.",
      optional: true,
    },
    starred: {
      type: "boolean",
      label: "Starred",
      description: "Whether the user has starred the file.",
      optional: true,
    },
    writersCanShare: {
      type: "boolean",
      label: "Writers Can Share",
      description:
        "Whether users with only writer permission can modify the file's permissions. Not populated for items in shared drives.",
      optional: true,
    },
  },
  async run() {
    const drive = this.googleDrive.drive();
    const body = this.fileUrl
      ? await got.stream(this.fileUrl)
      : fs.createReadStream(`${this.filePath}`);
    return (
      await drive.files.create({
        ignoreDefaultVisibility: this.ignoreDefaultVisibility,
        includePermissionsForView: this.includePermissionsForView,
        keepRevisionForever: this.keeprevisionForever,
        ocrLanguage: this.ocrLanguage,
        useContentAsIndexableText: this.useContentAsIndexableText,
        supportsAllDrives: this.supportsAllDrives,
        resource: {
          name: this.name,
          originalFilename: this.originalFilename,
          parents: [
            this.parents,
          ],
          mimeType: this.mimeType,
          description: this.description,
          folderColorRgb: this.folderColorRgb,
          shortcutDetails: {
            targetId: this.shortcutDetailsTargetId,
          },
          starred: this.starred,
          writersCanShare: this.writersCanShare,
          contentHints: {
            indexableText: this.contentHintsIndexableText,
          },
          contentRestrictions: {
            readOnly: this.contentRestrictionsReadOnly,
            reason: this.contentRestrictionsReason,
          },
          copyRequiresWriterPermission: this.copyRequiresWriterPermission,
        },
        media: {
          mimeType: this.mimeType,
          uploadType: this.uploadType,
          body,
        },
        fields: "*",
      })
    ).data;
  },
};
