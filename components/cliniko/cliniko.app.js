const { axios } = require("@pipedreamhq/platform");

module.exports = {
  type: "app",
  app: "cliniko",
  propDefinitions: {
    patientId: {
      type: "integer",
      label: "Patient ID",
      description: "Enter a unique patient ID.",
    },
  },
  methods: {
    /**
     * Get the Cliniko API key for the authenticated user.
     * @returns {String} The Cliniko API key.
     */
    _apiKey() {
      return this.$auth.api_key;
    },
    _shard() {
      return this.$auth.shard;
    },
    _baseApiUrl() {
      return `https://api.${this._shard()}.cliniko.com/v1`;
    },
    _makeRequestConfig(url) {
      const auth = {
        username: this._apiKey(),
        password: "", // No password needed.
      };
      // Cliniko requires contact email address in User-Agent header.
      // See https://github.com/redguava/cliniko-api#identifying-your-application.
      const headers = {
        "Accept": "application/json",
        "User-Agent": "Pipedream (support@pipedream.com)",
      };
      return {
        url,
        headers,
        auth,
      };
    },
    _patientsApiUrl(id = undefined) {
      const baseUrl = this._baseApiUrl();
      const basePath = "/patients";
      const path = id
        ? `${basePath}/${id}`
        : basePath;
      return `${baseUrl}${path}`;
    },
    /**
     * Get the details of a specified patient.
     * @params {Integer} patientId - The unique identifier of the patient
     * @returns {Object} The details of the specified patient.
     */
    async getPatient(patientId) {
      const apiUrl = this._patientsApiUrl(patientId);
      const requestConfig = this._makeRequestConfig(apiUrl);
      return await axios(this, requestConfig);
    },
  },
};
