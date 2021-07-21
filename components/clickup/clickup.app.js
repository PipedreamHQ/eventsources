const axios = require("axios");

module.exports = {
  type: "app",
  app: "clickup",
  propDefinitions: {
    workspace: {
      type: "string",
      label: "Workspace",
      async options() {
        const workspaces = (await this.getWorkspaces()).teams;
        return workspaces.map((workspace) => {
          return {
            label: workspace.name,
            value: workspace.id,
          };
        });
      },
    },
    space: {
      type: "string",
      label: "Space",
      async options({ workspace }) {
        const spaces = (await this.getSpaces(workspace)).spaces;
        return spaces.map((space) => {
          return {
            label: space.name,
            value: space.id,
          };
        });
      },
    },
    folder: {
      type: "string",
      label: "Folder",
      async options({ space }) {
        const folders = (await this.getFolders(space)).folders;
        return folders.map((folder) => {
          return {
            label: folder.name,
            value: folder.id,
          };
        });
      },
      optional: true,
    },
    list: {
      type: "string",
      label: "List",
      async options({
        folder, space,
      }) {
        const lists = folder
          ? (await this.getLists(folder)).lists
          : (await this.getFolderlessLists(space)).lists;
        return lists.map((list) => {
          return {
            label: list.name,
            value: list.id,
          };
        });
      },
    },
    assignees: {
      type: "string[]",
      label: "Assignees",
      description: "Select the assignees for the task",
      async options({ workspace }) {
        const members = await this.getWorkspaceMembers(workspace);
        return members.map((member) => {
          return {
            label: member.user.username,
            value: member.user.id,
          };
        });
      },
      optional: true,
    },
    tags: {
      type: "string[]",
      label: "Tags",
      description:
        "Select the tags for the task to filter when searching for the tasks",
      async options({ space }) {
        const tags = (await this.getTags(space)).tags;
        return tags.map((tag) => {
          return tag.name;
        });
      },
      optional: true,
    },
    status: {
      type: "string",
      label: "Status",
      description: "Select the status of the task",
      async options({ list }) {
        const statuses = (await this.getList(list)).statuses;
        return statuses.map((status) => {
          return status.status;
        });
      },
      optional: true,
    },
    task: {
      type: "string",
      label: "Task",
      async options({
        list, page,
      }) {
        const tasks = (await this.getTasks(list, page)).tasks;
        return tasks.map((task) => {
          return {
            label: task.name,
            value: task.id,
          };
        });
      },
    },
    priority: {
      type: "integer",
      label: "Priority",
      description: `1 is Urgent
        2 is High
        3 is Normal
        4 is Low`,
      optional: true,
    },
  },
  methods: {
    _getBaseUrl() {
      return "https://api.clickup.com/api/v2/";
    },
    _getHeader() {
      return {
        "content-type": "application/json",
        "Authorization": this.$auth.oauth_access_token,
      };
    },
    async _makeRequest(method, endpoint, data = null, params = null) {
      const config = {
        headers: this._getHeader(),
        method,
        url: `${this._getBaseUrl()}${endpoint}`,
        data,
        params,
      };
      return (await axios(config)).data;
    },
    async getWorkspaces() {
      return await this._makeRequest("GET", "team");
    },
    async getSpaces(workspaceId) {
      return await this._makeRequest(
        "GET",
        `team/${workspaceId}/space?archived=false`,
      );
    },
    async getFolders(spaceId) {
      return await this._makeRequest(
        "GET",
        `space/${spaceId}/folder?archived=false`,
      );
    },
    async getList(listId) {
      return await this._makeRequest("GET", `list/${listId}`);
    },
    async getLists(folderId) {
      return await this._makeRequest(
        "GET",
        `folder/${folderId}/list?archived=false`,
      );
    },
    async getFolderlessLists(spaceId) {
      return await this._makeRequest(
        "GET",
        `space/${spaceId}/list?archived=false`,
      );
    },
    async getWorkspaceMembers(workspaceId) {
      const workspaces = (await this.getWorkspaces()).teams;
      const workspace = workspaces.filter(
        (workspace) => workspace.id == workspaceId,
      );
      return workspace[0].members;
    },
    async getTags(spaceId) {
      return await this._makeRequest("GET", `space/${spaceId}/tag`);
    },
    async getTasks(listId, page = 0) {
      return await this._makeRequest(
        "GET",
        `list/${listId}/task?archived=false&page=${page}`,
      );
    },
    async createTask(listId, data) {
      return await this._makeRequest("POST", `list/${listId}/task`, data);
    },
    async createList(folderId, data) {
      return await this._makeRequest("POST", `folder/${folderId}/list`, data);
    },
    async createFolderlessList(spaceId, data) {
      return await this._makeRequest("POST", `space/${spaceId}/list`, data);
    },
  },
};
