const axios = require("axios");
const get = require("lodash/get");
const querystring = require("querystring");
const retry = require("async-retry");

module.exports = {
  type: "app",
  app: "microsoft_onedrive",
  methods: {
    _apiUrl() {
      return "https://graph.microsoft.com/v1.0";
    },
    _authToken() {
      return this.$auth.oauth_access_token;
    },
    /**
     * This is a utility method that returns the path to the authenticated
     * user's OneDrive drive
     *
     * @returns the path to the user's drive
     */
    _getMainDrivePath() {
      return "/me/drive";
    },
    /**
     * This is a utility method that returns the path to a OneDrive drive based
     * on its identifier, or the authenticated user's drive if an identifier is
     * not specified.
     *
     * @param {string}  [driveId] the OneDrive drive identifier. When not
     * provided, the method returns the path of the authenticated user's drive.
     * @returns the path to the specified drive
     */
    _getDrivePath(driveId) {
      return driveId
        ? `/drives/${driveId}`
        : this._getMainDrivePath();
    },
    /**
     * This is a utility method that returns the path to a OneDrive item based
     * on its identifier, or the root if an identifier is not specified.
     *
     * @param {string}  [driveItemId] the OneDrive item identifier. When not
     * provided, the method returns the path of the root item.
     * @returns the path to the specified drive
     */
    _getDriveItemPath(driveItemId) {
      return driveItemId
        ? `/items/${driveItemId}`
        : "/root";
    },
    /**
     * This is a utility method that returns the API URL that references a
     * OneDrive drive
     *
     * @param {string}  [driveId] the OneDrive drive identifier. When not
     * provided, the method returns the URL of the authenticated user's drive.
     * @returns the API URL referrencing a OneDrive drive
     */
    _driveEndpoint(driveId) {
      const baseUrl = this._apiUrl();
      const drivePath = this._getDrivePath(driveId);
      return `${baseUrl}${drivePath}`;
    },
    /**
     * This is a utility method that returns the API URL of the [OneDrive Delta
     * Link](https://bit.ly/3fNawcs) endpoint. Depending on the input arguments
     * provided by the caller, the endpoint will refer to the Delta endpoint of
     * a particular drive and/or folder.
     *
     * @example
     * // returns `${baseUrl}/me/drive/root/delta`
     * this._deltaEndpoint();
     *
     * @example
     * // returns `${baseUrl}/drives/bf3ec8cc5e81199f/root/delta`
     * this._deltaEndpoint({ driveId: "bf3ec8cc5e81199f" });
     *
     * @example
     * // returns `${baseUrl}/me/drive/items/BF3EC8CC5E81199F!104/delta`
     * this._deltaEndpoint({ folderId: "BF3EC8CC5E81199F!104" });
     *
     * @example
     * // returns `${baseUrl}/drives/bf3ec8cc5e81199f/items/BF3EC8CC5E81199F!104/delta`
     * this._deltaEndpoint({
     *   driveId: "bf3ec8cc5e81199f",
     *   folderId: "BF3EC8CC5E81199F!104",
     * });
     *
     * @param {object}  [opts] an object containing the different options
     * referring to the target of the Delta Link endpoint
     * @param {string}  [opts.driveId] the OneDrive drive identifier. When not
     * provided, the method uses the ID of the authenticated user's drive.
     * @param {string}  [opts.folderId] when provided, the returned URL will
     * point to the Delta Link endpoint of the specified folder. Otherwise, it
     * will point to the root of the drive.
     * @returns a [OneDrive Delta Link](https://bit.ly/3fNawcs) endpoint URL
     */
    _deltaEndpoint({
      driveId,
      folderId,
    } = {}) {
      const baseUrl = this._apiUrl();
      const drivePath = this._getDrivePath(driveId);
      const driveItemPath = this._getDriveItemPath(folderId);
      return `${baseUrl}${drivePath}${driveItemPath}/delta`;
    },
    /**
     * This is a utility method that returns the API URL of the endpoint
     * referencing to a drive folder's [children](https://bit.ly/3sC6V3F). The
     * specific drive and item are customizable.
     *
     * @example
     * // returns `${baseUrl}/me/drive/root/children`
     * this._deltaEndpoint();
     *
     * @example
     * // returns `${baseUrl}/drives/bf3ec8cc5e81199f/root/children`
     * this._deltaEndpoint({ driveId: "bf3ec8cc5e81199f" });
     *
     * @example
     * // returns `${baseUrl}/me/drive/items/BF3EC8CC5E81199F!104/children`
     * this._deltaEndpoint({ folderId: "BF3EC8CC5E81199F!104" });
     *
     * @example
     * // returns `${baseUrl}/drives/bf3ec8cc5e81199f/items/BF3EC8CC5E81199F!104/children`
     * this._deltaEndpoint({
     *   driveId: "bf3ec8cc5e81199f",
     *   folderId: "BF3EC8CC5E81199F!104",
     * });
     *
     * @param {object}  [opts] an object containing the different options
     * referring to the target of the Delta Link endpoint
     * @param {string}  [opts.driveId] the OneDrive drive identifier. When not
     * provided, the method uses the ID of the authenticated user's drive.
     * @param {string}  [opts.folderId] when provided, the returned URL will
     * point to the children endpoint of the specified folder. Otherwise, it
     * will point to the root of the drive.
     * @returns an endpoint URL referencing the drive folder's children
     */
    _driveChildrenEndpoint({
      driveId,
      folderId,
    } = {}) {
      const baseUrl = this._apiUrl();
      const drivePath = this._getDrivePath(driveId);
      const driveItemPath = this._getDriveItemPath(folderId);
      return `${baseUrl}${drivePath}${driveItemPath}/children`;
    },
    _subscriptionsEndpoint(id) {
      const baseUrl = this._apiUrl();
      const url = `${baseUrl}/subscriptions`;
      return id
        ? `${url}/${id}`
        : url;
    },
    _makeRequestConfig() {
      const authToken = this._authToken();
      const headers = {
        "Authorization": `bearer ${authToken}`,
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    /**
     * This method is intended to be used as a decorator around external API
     * calls. It provides exponential backoff retries for the calls made to a
     * specified function, and aborts with an exception if the call fails with a
     * non-retriable error or if the maximum retry count is reached.
     *
     * @param {function}  apiCall is a function that encapsulates an API call.
     * The function will be called without any additional parameters, so this
     * argument should already define the closure needed to operate.
     * @param {function}  [isRequestRetriable] is a function that determines
     * whether a failed request should be retried or not based on the exception
     * thrown by a call to the `apiCall` argument. When it's not provided, the
     * behaviour defaults to retrying the call based on the value of
     * `exception.response.status` (see the `_isStatusCodeRetriable` method).
     * @returns a promise containing the result of the call to `apiCall`, or an
     * exception containing the details about the last error
     */
    _withRetries(
      apiCall,
      isRequestRetriable = this._isStatusCodeRetriable.bind(this),
    ) {
      const retryOpts = {
        retries: 5,
        factor: 2,
        minTimeout: 2000, // In milliseconds
      };
      return retry(async (bail, retryCount) => {
        try {
          return await apiCall();
        } catch (err) {
          if (!isRequestRetriable(err)) {
            const statusCode = get(err, [
              "response",
              "status",
            ]);
            const errData = get(err, [
              "response",
              "data",
            ], {});
            return bail(new Error(`
              Unexpected error (status code: ${statusCode}):
              ${JSON.stringify(errData, null, 2)}
            `));
          }

          console.log(`
            [Attempt #${retryCount}] Temporary error: ${err.message}
          `);
          throw err;
        }
      }, retryOpts);
    },
    _isStatusCodeRetriable(responseErr) {
      const statusCode = get(responseErr, [
        "response",
        "status",
      ]);
      return [
        429,
        500,
        503,
        509,
      ].includes(statusCode);
    },
    _isHookRequestRetriable(responseErr) {
      // Sometimes an API call to create a webhook/subscription fails because
      // our component was unable to quickly validate the subscription. In those
      // cases, we want to retry the request since at this point the webhook is
      // not created but the request itself is well formed.
      //
      // See the docs for more information on how webhooks are validated upon
      // creation: https://bit.ly/3fzc3Tr
      const errPattern = /endpoint must respond .*? to validation request/i;
      const errMsg = get(responseErr, [
        "response",
        "data",
        "error",
        "message",
      ], "");
      return (
        errPattern.test(errMsg) ||
        this._isStatusCodeRetriable(responseErr)
      );
    },
    _getDefaultHookExpirationDateTime() {
      // 30 days from now
      const futureTimestamp = Date.now() + 43200 * 60 * 1000;
      return new Date(futureTimestamp).toISOString();
    },
    /**
     * This method creates a [OneDrive webhook](https://bit.ly/2PxfQ9j) to
     * monitor a specific resource, defaulted to the authenticated user's drive.
     *
     * @param {string}  notificationUrl the target URL of the webhook
     * @param {object}  [opts] an object containing the different options for
     * the hook creation
     * @param {string}  [opts.driveId] the resource to which the webhook will
     * subscribe for events
     * @param {string}  [opts.expirationDateTime] the timestamp of the hook
     * subscription expiration, in ISO-8601 format. Defaults to 30 days after
     * the time this method is called.
     * @returns the ID of the created webhook
     */
    async createHook(notificationUrl, {
      driveId,
      expirationDateTime = this._getDefaultHookExpirationDateTime(),
    } = {}) {
      const url = this._subscriptionsEndpoint();
      const drivePath = this._getDrivePath(driveId);
      const resource = `${drivePath}/root`;
      const requestData = {
        notificationUrl,
        resource,
        expirationDateTime,
        changeType: "updated",
      };
      const requestConfig = this._makeRequestConfig();
      const { data: { id: hookId } = {} } = await this._withRetries(
        () => axios.post(url, requestData, requestConfig),
        this._isHookRequestRetriable.bind(this),
      );
      return hookId;
    },
    /**
     * This method performs an update to a [OneDrive
     * webhook](https://bit.ly/2PxfQ9j). An example of such operation is to
     * extend the expiration time of a webhook subscription.
     *
     * @param {string}  id the ID of the webhook to update
     * @param {object}  [opts] the fields to update in the webhook
     * @param {string}  [opts.expirationDateTime] the new expiration date of the
     * webhook subscription
     */
    async updateHook(id, { expirationDateTime } = {}) {
      const url = this._subscriptionsEndpoint(id);
      const requestData = {
        expirationDateTime,
      };
      const requestConfig = this._makeRequestConfig();
      await this._withRetries(
        () => axios.patch(url, requestData, requestConfig),
        this._isHookRequestRetriable.bind(this),
      );
    },
    /**
     * This method deletes an existing [OneDrive
     * webhook](https://bit.ly/2PxfQ9j)
     *
     * @param {string}  id the ID of the webhook to delete
     */
    async deleteHook(id) {
      const url = this._subscriptionsEndpoint(id);
      const requestConfig = this._makeRequestConfig();
      await this._withRetries(
        () => axios.delete(url, requestConfig),
      );
    },
    /**
     * This method returns a parameterized [OneDrive Delta
     * Link](https://bit.ly/3fNawcs) for a particular drive and/or item
     * (defaulting to the root of the authenticated user's drive). The link will
     * also include additional query parameters, depending on the options
     * provded by the caller.
     *
     * @param {object}  [opts] an object containing the different options to
     * customize the Delta Link
     * @param {string}  [opts.driveId] the OneDrive drive identifier. When not
     * provided, the method uses the ID of the authenticated user's drive.
     * @param {string}  [opts.folderId] the top-level folder that the returned
     * Delta Link will track. When left unset, the link will refer to the entire
     * drive.
     * @param {number}  [opts.pageSize] the size of the page that a call to the
     * returned Delta Link will retrieve (see the `$top` parameter in the [Delta
     * Link docs](https://bit.ly/3sRzRpn))
     * @param {string}  [opts.token] a [Delta Link
     * token](https://bit.ly/3ncApEf), which will be directly added to the
     * returned link. Especially useful when retrieving the _latest_ Delta Link.
     * @returns a [OneDrive Delta Link](https://bit.ly/3fNawcs)
     */
    getDeltaLink({
      driveId,
      folderId,
      pageSize,
      token,
    } = {}) {
      const url = this._deltaEndpoint({
        driveId,
        folderId,
      });

      const params = {};
      if (pageSize) {
        params.$top = Math.max(pageSize, 1);
      }
      if (token) {
        params.token = token;
      }
      const paramsString = querystring.stringify(params);

      return `${url}?${paramsString}`;
    },
    /**
     * This method retrieves the [latest OneDrive Delta
     * Link](https://bit.ly/3wB5d5O) for the authenticated user's drive
     *
     * @param {object}  [opts] an object containing the different options to
     * customize the retrieved Delta Link
     * @param {string}  [opts.folderId] the top-level folder to track with the
     * Delta Link. When left unset, the link will refer to the entire drive.
     * @returns the [latest OneDrive Delta Link](https://bit.ly/3wB5d5O)
     */
    async getLatestDeltaLink({ folderId } = {}) {
      const params = {
        token: "latest",
        folderId,
      };
      const url = this.getDeltaLink(params);
      const requestConfig = this._makeRequestConfig();
      const { data } = await this._withRetries(
        () => axios.get(url, requestConfig),
      );
      return data["@odata.deltaLink"];
    },
    /**
     * This generator method scans the latest updated items in a OneDrive drive
     * based on the provided Delta Link. It yields drive items until the updated
     * items collection is exhausted, after which it finally returns the Delta
     * Link to use in future scans.
     *
     * @param {string}  deltaLink the [OneDrive Delta
     * Link](https://bit.ly/3fNawcs) from where to start scanning the drive's
     * items
     * @yields the next updated item in the drive
     * @returns the Delta Link to use in the next drive scan
     */
    async *scanDeltaItems(deltaLink) {
      const requestConfig = this._makeRequestConfig();
      let url = deltaLink;
      while (url) {
        // See the docs for more information on the format of the delta API
        // response: https://bit.ly/31I0wZP
        const { data } = await this._withRetries(
          () => axios.get(url, requestConfig),
        );
        const {
          "@odata.nextLink": nextLink,
          "@odata.deltaLink": nextDeltaLink,
          "value": driveItems,
        } = data;
        for (const driveItem of driveItems) {
          yield driveItem;
        }

        if (driveItems.length === 0 || nextDeltaLink) {
          return nextDeltaLink;
        }

        url = nextLink;
      }
    },
    /**
     * This generator method scans the folders under the specified OneDrive
     * drive and/or folder. The scan is limited to the root of the specified
     * drive and/or folder (i.e. it does **not** perform a recursive scan).
     *
     * @param {object}  [opts] an object containing the different options
     * referring to the target of the Delta Link endpoint
     * @param {string}  [opts.driveId] the OneDrive drive identifier. When not
     * provided, the method uses the ID of the authenticated user's drive.
     * @param {string}  [opts.folderId] when provided, the method will return
     * the child folders under this one. Otherwise, it will stick to the root of
     * the drive.
     * @yields the next child folder
     */
    async *listFolders({
      driveId,
      folderId,
    } = {}) {
      const fieldsToRetrieve = [
        "folder",
        "id",
        "name",
      ];
      const params = {
        $orderby: "name",
        $select: fieldsToRetrieve.join(","),
      };
      const baseRequestConfig = this._makeRequestConfig();
      const requestConfig = {
        ...baseRequestConfig,
        params,
      };

      let url = this._driveChildrenEndpoint({
        driveId,
        folderId,
      });
      while (url) {
        const { data } = await this._withRetries(
          () => axios.get(url, requestConfig),
        );
        const {
          "@odata.nextLink": nextLink,
          "value": children,
        } = data;
        for (const child of children) {
          if (!child.folder) {
            // We skip non-folder children
            continue;
          }

          yield child;
        }

        url = nextLink;
      }
    },
  },
};
