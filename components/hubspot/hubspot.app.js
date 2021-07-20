const axios = require("axios");

module.exports = {
  type: "app",
  app: "hubspot",
  propDefinitions: {
    lists: {
      type: "string[]",
      label: "Lists",
      description: "Select the lists to watch for new contacts.",
      async options(prevContext) {
        const { offset = 0 } = prevContext;
        const params = {
          count: 250,
          offset,
        };
        const results = await this.getLists(params);
        const options = results.map((result) => {
          const {
            name: label,
            listId,
          } = result;
          return {
            label,
            value: JSON.stringify({
              label,
              value: listId,
            }),
          };
        });
        return {
          options,
          context: {
            offset: params.offset + params.count,
          },
        };
      },
    },
    stages: {
      type: "string[]",
      label: "Stages",
      description: "Select the stages to watch for new deals in.",
      async options() {
        const results = await this.getDealStages();
        const options = results.results[0].stages.map((result) => {
          const {
            label,
            stageId,
          } = result;
          return {
            label,
            value: JSON.stringify({
              label,
              value: stageId,
            }),
          };
        });
        return options;
      },
    },
    objectType: {
      type: "string",
      label: "Object Type",
      description: "Watch for new events concerning the object type specified.",
      async options() {
        return [
          {
            label: "Companies",
            value: "company",
          },
          {
            label: "Contacts",
            value: "contact",
          },
          {
            label: "Deals",
            value: "deal",
          },
          {
            label: "Tickets",
            value: "ticket",
          },
        ];
      },
    },
    objectIds: {
      type: "string[]",
      label: "Object",
      description: "Watch for new events concerning the objects selected.",
      async options(opts) {
        let objectType = null;
        if (opts.objectType == "company") objectType = "companies";
        else objectType = `${opts.objectType}s`;
        const results = await this.getObjects(objectType);
        const options = results.map((result) => {
          const {
            id,
            properties,
          } = result;
          let label;
          switch (objectType) {
          case "companies":
            label = properties.name;
            break;
          case "contacts":
            label = `${properties.firstname} ${properties.lastname}`;
            break;
          case "deals":
            label = properties.dealname;
            break;
          case "tickets":
            label = properties.subject;
            break;
          }
          return {
            label,
            value: id,
          };
        });
        return options;
      },
    },
    forms: {
      type: "string[]",
      label: "Form",
      description: "Watch for new submissions of the specified forms.",
      async options(prevContext) {
        const { offset } = prevContext;
        const params = {
          count: 50,
          offset: offset || 0,
        };
        const results = await this.getForms();
        const options = results.map((result) => {
          const {
            name: label,
            guid,
          } = result;
          return {
            label,
            value: JSON.stringify({
              label,
              value: guid,
            }),
          };
        });
        return {
          options,
          context: {
            offset: params.offset + params.count,
          },
        };
      },
    },
    channel: {
      type: "string",
      label: "Social Media Channel",
      async options() {
        const channels = await this.getPublishingChannels();
        const options = channels.map((channel) => {
          const {
            accountType,
            username,
            channelKey: value,
          } = channel;
          const label = `${accountType} ${username}`;
          return {
            label,
            value,
          };
        });
        return options;
      },
    },
  },
  methods: {
    _getBaseURL() {
      return "https://api.hubapi.com";
    },
    _getHeaders() {
      return {
        "Authorization": `Bearer ${this.$auth.oauth_access_token}`,
        "Content-Type": "application/json",
      };
    },
    monthAgo() {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    },
    async makeGetRequest(endpoint, params = null) {
      const config = {
        method: "GET",
        url: `${this._getBaseURL()}${endpoint}`,
        headers: this._getHeaders(),
        params,
      };
      return (await axios(config)).data;
    },
    async searchCRM({
      object, ...data
    }) {
      const config = {
        method: "POST",
        url: `${this._getBaseURL()}/crm/v3/objects/${object}/search`,
        headers: this._getHeaders(),
        data,
      };
      return (await axios(config)).data;
    },
    async getBlogPosts(params) {
      return await this.makeGetRequest("/cms/v3/blogs/posts", params);
    },
    async getCalendarTasks(endDate) {
      const params = {
        startDate: Date.now(),
        endDate,
      };
      return await this.makeGetRequest("/calendar/v1/events/task", params);
    },
    async getContactProperties() {
      return await this.makeGetRequest("/properties/v1/contacts/properties");
    },
    async createPropertiesArray() {
      const allProperties = await this.getContactProperties();
      return allProperties.map((property) => property.name);
    },
    async getDealProperties() {
      return await this.makeGetRequest("/properties/v1/deals/properties");
    },
    async getDealStages() {
      return await this.makeGetRequest("/crm-pipelines/v1/pipelines/deal");
    },
    async getEmailEvents(params) {
      return await this.makeGetRequest("/email/public/v1/events", params);
    },
    async getEngagements(params) {
      return await this.makeGetRequest(
        "/engagements/v1/engagements/paged",
        params,
      );
    },
    async getEvents(params) {
      return await this.makeGetRequest("/events/v3/events", params);
    },
    async getForms(params) {
      return await this.makeGetRequest("/forms/v2/forms", params);
    },
    async getFormSubmissions(params) {
      const { formId } = params;
      delete params.formId;
      return await this.makeGetRequest(
        `/form-integrations/v1/submissions/forms/${formId}`,
        params,
      );
    },
    async getLists(params) {
      const { lists } = await this.makeGetRequest("/contacts/v1/lists", params);
      return lists;
    },
    async getListContacts(params, listId) {
      return await this.makeGetRequest(
        `/contacts/v1/lists/${listId}/contacts/all`,
        params,
      );
    },
    async getObjects(objectType) {
      const params = {
        limit: 100,
      };
      let results = null;
      const objects = [];
      while (!results || params.next) {
        results = await this.makeGetRequest(
          `/crm/v3/objects/${objectType}`,
          params,
        );
        if (results.paging) params.next = results.paging.next.after;
        else delete params.next;
        for (const result of results.results) {
          objects.push(result);
        }
      }
      return objects;
    },
    async getContact(contactId, properties) {
      const params = {
        properties,
      };
      return await this.makeGetRequest(
        `/crm/v3/objects/contacts/${contactId}`,
        params,
      );
    },
    async getLineItem(lineItemId) {
      return await this.makeGetRequest(`/crm/v3/objects/line_items/${lineItemId}`);
    },
    getCRMObjects() {
      return [
        "companies",
        "contacts",
        "deals",
        "products",
        "tickets",
        "line_items",
        "quotes",
        "custom_objects",
      ];
    },
    async getPublishingChannels() {
      return await this.makeGetRequest("/broadcast/v1/channels/setting/publish/current");
    },
    async getBroadcastMessages(params) {
      return await this.makeGetRequest("/broadcast/v1/broadcasts", params);
    },
    async getEmailSubscriptionsTimeline(params) {
      return await this.makeGetRequest("/email/public/v1/subscriptions/timeline", params);
    },
  },
};
