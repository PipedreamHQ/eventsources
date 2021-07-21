const axios = require("axios");
const get = require("lodash/get");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "pcloud",
  propDefinitions: {
    domainLocation: {
      type: "string",
      label: "Domain Location",
      description:
        "The domain location of your account. The pCloud API domain URL depends on the location of pCLoud data center associated to your account.",
      default: "US",
      options: ["US", "EU"],
    },
  },
  methods: {
    _authToken() {
      return this.$auth.oauth_access_token;
    },
    _apiUrl(domainLocation) {
      const subdomain = domainLocation == "EU" ? "eapi" : "api";
      return `https://${subdomain}.pcloud.com`;
    },
    _makeRequestConfig() {
      const authToken = this._authToken();
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    _isRetriableStatusCode(statusCode) {
      [408, 429, 500].includes(statusCode);
    },
    async _withRetries(apiCall) {
      const retryOpts = {
        retries: 3,
        factor: 2,
      };
      return retry(async (bail) => {
        try {
          return await apiCall();
        } catch (err) {
          const statusCode = [get(err, ["response", "status"])];
          if (!this._isRetriableStatusCode(statusCode)) {
            bail(`
              Unexpected error (status code: ${statusCode}):
              ${JSON.stringify(err.message)}
            `);
          }
          console.warn(`Temporary error: ${err.message}`);
          throw err;
        }
      }, retryOpts);
    },
    /**
     * Takes one file and copies it as another file in the user's filesystem.
     * @params {string} domainLocation - The domain location of the connected pCloud account. The pCloud API domain URL depends on the location of pCLoud data center associated to the account.
     * @params {integer} fileId - Id of the file to copy.
     * @params {string} path - Path to the file to copy.
     * @params {integer} toFolderId - Id of the destination folder.
     * @params {string} toPath - Destination path, including the filename. A new filename can be used. When this is used, `toName` is ignored.
     * @params {string} toName - Name of the destination file. This is used only if the destination folder is specified with `toFolderId`.
     * @params {integer} noOver - If this is set and a file with the specified name already exists, no overwriting will be performed.
     * @params {string} modifiedTime - If specified, file modified time is set. Must be in unix time seconds.
     * @params {string} createdTime - If specified, file created time is set. It's required to provide `modifiedTime` to set `createdTime`. Must be in unix time seconds.
     * @returns {metadata: array, result: integer } An array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of the newly copied file. A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async copyFile(
      domainLocation,
      fileId,
      path,
      toFolderId,
      toPath,
      toName,
      noOver,
      modifiedTime,
      createdTime
    ) {
      const url = `${this._apiUrl(domainLocation)}/copyfile`;
      const requestConfig = this._makeRequestConfig();
      const FormData = require("form-data");
      const requestData = new FormData();
      if (fileId) {
        requestData.append("fileid", fileId);
      } else {
        requestData.append("path", path);
      }
      if (toFolderId) {
        requestData.append("tofolderid", toFolderId);
      } else {
        requestData.append("topath", toPath);
      }
      if (toName) {
        requestData.append("toname", toName);
      }
      if (noOver) {
        requestData.append("noover", noOver);
      }
      if (modifiedTime) {
        requestData.append("mtime", modifiedTime);
      }
      if (createdTime) {
        requestData.append("ctime", createdTime);
      }
      requestConfig.headers[
        "Content-Type"
      ] = `multipart/form-data; boundary=${requestData._boundary}`;
      requestConfig.headers["Content-Length"] = requestData.getLengthSync();
      return (
        await this._withRetries(() =>
          axios.post(url, requestData, requestConfig)
        )
      ).data;
    },
    /**
     * Copies a folder to the specified path or folder.
     * @params {string} domainLocation - The domain location of the connected pCloud account. The pCloud API domain URL depends on the location of pCLoud data center associated to the account.
     * @params {integer} folderId - Id of the folder to copy.
     * @params {string} path - Path to the folder to copy contents. If `path` or `folderId` are not present, then root folder is used.
     * @params {integer} toFolderId - Id of the destination folder.
     * @params {string} toPath - Path to the destination folder.
     * @params {integer} noOver - If it is set and files with the same name already exist, no overwriting will be preformed and error `2004` will be returned.
     * @params {integer} skipExisting - If set will skip files that already exist.
     * @params {integer} copyContentOnly - If it is set only the content of source folder will be copied otherwise the folder itself is copied.
     * @returns {metadata: array, result: integer } An array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of the newly copied folder. A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async copyFolder(
      domainLocation,
      folderId,
      path,
      toFolderId,
      toPath,
      noOver,
      skipExisting,
      copyContentOnly
    ) {
      const url = `${this._apiUrl(domainLocation)}/copyfolder`;
      const requestConfig = this._makeRequestConfig();
      const FormData = require("form-data");
      const requestData = new FormData();
      if (folderId) {
        requestData.append("folderid", folderId);
      } else {
        requestData.append("path", path);
      }
      if (toFolderId) {
        requestData.append("tofolderid", toFolderId);
      } else {
        requestData.append("topath", toPath);
      }
      if (noOver) {
        requestData.append("noover", noOver);
      }
      if (skipExisting) {
        requestData.append("skipexisting", skipExisting);
      }
      if (copyContentOnly) {
        requestData.append("copycontentonly", copyContentOnly);
      }
      requestConfig.headers[
        "Content-Type"
      ] = `multipart/form-data; boundary=${requestData._boundary}`;
      requestConfig.headers["Content-Length"] = requestData.getLengthSync();
      return (
        await this._withRetries(() =>
          axios.post(url, requestData, requestConfig)
        )
      ).data;
    },
    /**
     * Creates a folder in the specified path or folder.
     * @params {string} domainLocation - The domain location of the connected pCloud account. The pCloud API domain URL depends on the location of pCLoud data center associated to the account.
     * @params {integer} folderId - Id of the parent folder where the new folder will be created.
     * @params {string} path - Path to the parent folder, where the new folder will be created.
     * @params {string} name - Name of the folder to be created.
     * @returns {metadata: array, result: integer } An array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of the newly created folder. A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async createFolder(domainLocation, folderId, path, name) {
      const url = `${this._apiUrl(domainLocation)}/createfolder`;
      const requestConfig = this._makeRequestConfig();
      const FormData = require("form-data");
      const requestData = new FormData();
      if (folderId) {
        requestData.append("folderid", folderId);
      } else {
        requestData.append("path", path);
      }
      if (name) {
        requestData.append("name", name);
      }
      requestConfig.headers[
        "Content-Type"
      ] = `multipart/form-data; boundary=${requestData._boundary}`;
      requestConfig.headers["Content-Length"] = requestData.getLengthSync();
      return (
        await this._withRetries(() =>
          axios.post(url, requestData, requestConfig)
        )
      ).data;
    },
    /**
     * Downloads one or more files from links suplied in the url parameter.
     * @params {string} domainLocation - The domain location of the connected pCloud account. The pCloud API domain URL depends on the location of pCLoud data center associated to the account.
     * @params {string} urls - URLs of the files to download, separated by whitespaces.
     * @params {string} path - Path to folder, in which to download the files. If `path` or `folderId` are not present, then root folder is used
     * @params {integer} folderId - Id of the folder, in which to download the files.
     * @params {string} targetFilenames - Desired names for the downloaded files, separated by commas.
     * @returns {metadata: array, result: integer } An array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of each of the downloaded files. A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async downloadFiles(domainLocation, urls, path, folderId, targetFilenames) {
      const url = `${this._apiUrl(domainLocation)}/downloadfile`;
      const requestConfig = this._makeRequestConfig();
      requestConfig.params = {
        url: urls,
        target: targetFilenames,
      };
      if (path) {
        requestConfig.params.path = path;
      } else {
        requestConfig.params.folderid = folderId;
      }
      return await this._withRetries(() => axios.get(url, requestConfig));
    },
    /**
     * Lists the metadata of the specified folder's contents.
     * @params {string} domainLocation - The domain location of the connected pCloud account. The pCloud API domain URL depends on the location of pCLoud data center associated to the account.
     * @params {string} path - Path to the folder list contents. If `path` or `folderId` are not present, then root folder is used.
     * @params {integer} folderId - Id of the folder to list contents.
     * @params {integer} recursive - If is set full directory tree will be returned, which means that all directories will have contents filed.
     * @params {integer} showdeleted - If is set, deleted files and folders that can be undeleted will be displayed.
     * @params {integer} nofiles - If is set, only the folder (sub)structure will be returned.
     * @params {integer} noshares - If is set, only user's own folders and files will be displayed.
     * @returns {metadata: array, result: integer } An array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of each of the retrieved files and folders, if `recursive` is set, an additional `contents` element will be presented for the contents of inner folders. A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async listContents(
      domainLocation,
      path,
      folderId,
      recursive,
      showdeleted,
      nofiles,
      noshares
    ) {
      const url = `${this._apiUrl(domainLocation)}/listfolder`;
      const requestConfig = this._makeRequestConfig();
      requestConfig.params = {
        recursive,
        showdeleted,
        nofiles,
        noshares,
      };
      if (path) {
        requestConfig.params.path = path;
      } else {
        requestConfig.params.folderid = folderId;
      }
      return (await this._withRetries(() => axios.get(url, requestConfig)))
        .data;
    },
    async makeAnAPICall(method, path, headers, body, useFormData) {
      const sp = path.split("?");
      const cleanedPath = sp[0].replace(/^\/*/, "").replace(/\/*$/, "");
      const url =
        sp.length == 1
          ? `${this._apiUrl()}/${cleanedPath}`
          : `${this._apiUrl()}/${cleanedPath}?${sp[1]}`;
      const { headers: baseHeaders } = this._makeRequestConfig();
      const config = {
        method,
        url,
        headers: {
          ...baseHeaders,
          headers: headers ? headers : null,
        },
      };
      const FormData = require("form-data");
      const formData = new FormData();
      if (useFormData) {
        Object.keys(body).forEach(function (k) {
          formData.append(k, body[k]);
        });
        config.headers[
          "Content-Type"
        ] = `multipart/form-data; boundary=${formData._boundary}`;
        config.headers["Content-Length"] = formData.getLengthSync();
        config.data = formData;
      } else {
        config.headers["Content-Type"] = "application/json";
        config.data = body;
      }
      const { data } = await /*this._withRetries(() => */ axios.request(config);
      return data;
    },
    /**
     * Uploads a file to the user's filesystem.
     * @params {string} path - Path to the folder where the file will be uploaded (discouraged). If neither `path` nor `folderid` are specified, the root folder will be used.
     * @params {integer} folderid - Id of the folder where the file will be uploaded.
     * @params {string} filename - Name of the file to upload.
     * @params {integer} noPartial - If is set, partially uploaded files will not be saved.
     * @params {string} progressHash - Used for observing upload progress.
     * @params {integer} renameIfExists - If set, the uploaded file will be renamed, if file with the requested name exists in the folder.
     * @params {integer} mtime - If set, file modified time is set. Must be a unix timestamp.
     * @params {integer} ctime - If set, file created time is set. Must be a unix timestamp. It's required to provide `mtime` to set `ctime`.
     * @returns {checksums: array, fileids: array, metadata: array, result: integer} A `checksums` array, each element with the file checksums calculated with `md5` and `sha1` algorithms, the `id` of the created file under the one element `fileids` array, and an array with the [metadata](https://docs.pcloud.com/structures/metadata.html) of the newly uploaded file.  A `result` integer that indicates the results of the API operation, 0 means success, a non-zero result means an error occurred, when the result is non-zero an `error` message is included.
     */
    async uploadFile(
      domainLocation,
      path,
      folderId,
      fileName,
      noPartial,
      progressHash,
      renameIfExists,
      mtime,
      ctime
    ) {
      const url = `${this._apiUrl(domainLocation)}/uploadfile`;
      const requestConfig = this._makeRequestConfig();
      const FormData = require("form-data");
      const requestData = new FormData();
      if (folderId) {
        requestData.append("folderid", folderId);
      } else {
        requestData.append("path", path);
      }
      const fs = require("fs");
      const file = fs.createReadStream(`/tmp/${fileName}`);
      requestData.append("file", file, { filename: fileName });
      if (noPartial) {
        requestData.append("nopartial", noPartial);
      }
      if (progressHash) {
        requestData.append("progresshash", progressHash);
      }
      if (renameIfExists) {
        requestData.append("renameifexists", renameIfExists);
      }
      if (mtime) {
        requestData.append("mtime", mtime);
      }
      if (ctime) {
        requestData.append("ctime", ctime);
      }
      function fileGetLengthWrapper(formData) {
        return new Promise((resolve, reject) => {
          formData.getLength(function (err, length) {
            if (err) {
              reject(err);
            }
            resolve(length);
          });
        });
      }
      requestConfig.headers["Content-Length"] = await fileGetLengthWrapper(
        requestData
      );
      requestConfig.headers[
        "Content-Type"
      ] = `multipart/form-data; boundary=${requestData._boundary}`;
      return (
        await this._withRetries(() =>
          axios.post(url, requestData, requestConfig)
        )
      ).data;
    },
  },
};
