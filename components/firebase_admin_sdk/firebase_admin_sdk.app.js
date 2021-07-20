const admin = require("firebase-admin");
const axios = require("axios");

module.exports = {
  type: "app",
  app: "firebase_admin_sdk",
  propDefinitions: {
    path: {
      type: "string",
      label: "Path",
      description: "A relative path to the location of child data",
    },
    query: {
      type: "string",
      label: "Structured Query",
      description:
        "The JSON contents of the Structured Query. https://cloud.google.com/firestore/docs/reference/rest/v1beta1/StructuredQuery",
    },
    apiKey: {
      type: "string",
      label: "API Key",
      description:
        "API Key refers to the Web API Key, which can be obtained on the project settings page in your admin console.",
      secret: true,
    },
  },
  methods: {
    /**
     * Creates and initializes a Firebase app instance.
     */
    async initializeApp() {
      const {
        projectId,
        clientEmail,
        privateKey,
      } = this.$auth;
      const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
      return await admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`,
      });
    },
    /**
     * Renders this app instance unusable and frees the resources of all associated services.
     */
    deleteApp() {
      return this.getApp().delete();
    },
    /**
     * Retrieves the default Firebase app instance.
     */
    getApp() {
      return admin.app();
    },
    _getHeaders(token) {
      const defaultHeader = {
        "Content-Type": "applicaton/json",
      };
      const headers = token
        ? {
          ...defaultHeader,
          Authorization: `Bearer ${token}`,
        }
        : defaultHeader;
      return headers;
    },
    async _makeRequest(method, url, data, params = {}, token = null) {
      const config = {
        method,
        url,
        headers: this._getHeaders(token),
        data,
        params,
      };
      return (await axios(config)).data;
    },
    /**
     * Retrieves a Bearer token for use with the Firebase REST API.
     * @param {string} apiKey - the Web API Key, which is obtained from the project
     * settings page in the admin console
     * @returns {object} returns an object containing a new token and refresh token
     */
    async _getToken(apiKey) {
      const { clientEmail } = this.$auth;
      const newCustomToken = await admin
        .auth()
        .createCustomToken(clientEmail)
        .catch((error) => {
          console.log("Error creating custom token:", error);
        });
      const data = {
        token: newCustomToken,
        returnSecureToken: true,
      };
      const params = {
        key: apiKey,
      };
      return await this._makeRequest(
        "POST",
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken",
        data,
        params,
      );
    },
    /**
     * @param {string} structuredQuery - A structured query in the format specified in
     * this documentation:
     * https://cloud.google.com/firestore/docs/reference/rest/v1/StructuredQuery
     * @param {string} apiKey - the Web API Key, which is obtained from the project settings
     * page in the admin console
     * @returns {array} an array of the documents returned from the structured query
     */
    async runQuery(structuredQuery, apiKey) {
      const { idToken } = await this._getToken(apiKey);
      const { projectId } = this.$auth;
      const parent = `projects/${projectId}/databases/(default)/documents`;
      const data = {
        structuredQuery,
      };
      return await this._makeRequest(
        "POST",
        `https://firestore.googleapis.com/v1/${parent}:runQuery`,
        data,
        null,
        idToken,
      );
    },
  },
};
