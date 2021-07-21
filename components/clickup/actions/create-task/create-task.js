const common = require("../common.js");

module.exports = {
  ...common,
  key: "clickup-create-task",
  name: "Create Task",
  description: "Creates a new task",
  version: "0.0.1",
  type: "action",
  props: {
    ...common.props,
    list: {
      propDefinition: [
        common.props.clickup,
        "list",
        (c) => ({
          folder: c.folder,
          space: c.space,
        }),
      ],
    },
    name: {
      type: "string",
      label: "Name",
      description: "New task name",
    },
    description: {
      type: "string",
      label: "Description",
      description: "New task description",
      optional: true,
    },
    assignees: {
      propDefinition: [
        common.props.clickup,
        "assignees",
        (c) => ({
          workspace: c.workspace,
        }),
      ],
    },
    tags: {
      propDefinition: [
        common.props.clickup,
        "tags",
        (c) => ({
          space: c.space,
        }),
      ],
    },
    status: {
      propDefinition: [
        common.props.clickup,
        "status",
        (c) => ({
          list: c.list,
        }),
      ],
    },
    dueDate: {
      type: "string",
      label: "Due Date",
      description:
        "The date by which you must complete the task. Use UTC time in milliseconds (ex. 1508369194377)",
      optional: true,
    },
    dueDateTime: {
      type: "boolean",
      label: "Due Date Time",
      description:
        "Set to true if you want to enable the due date time for the task",
      optional: true,
    },
    timeEstimate: {
      type: "string",
      label: "Time Estimate",
      description: "Use milliseconds",
      optional: true,
    },
    startDate: {
      type: "string",
      label: "Start Date",
      description:
        "The start date of the task. Use UTC time in milliseconds (ex. 1567780450202)",
      optional: true,
    },
    startDateTime: {
      type: "boolean",
      label: "Start Date Time",
      description: "Select true if you want to enable the start date time",
      optional: true,
    },
    notifyAll: {
      type: "boolean",
      label: "Notify All",
      description:
        "If notify_all is true, creation notifications will be sent to everyone including the creator of the task.",
      optional: true,
    },
    parent: {
      propDefinition: [
        common.props.clickup,
        "task",
        (c) => ({
          list: c.list,
        }),
      ],
      label: "Parent",
      description:
        "Passing an existing task ID in the parent property will make the new task a subtask of that parent. The parent you pass must not be a subtask itself, and must be part of the specified list.",
      optional: true,
    },
    linksTo: {
      propDefinition: [
        common.props.clickup,
        "task",
        (c) => ({
          list: c.list,
        }),
      ],
      label: "Links To",
      description:
        "Accepts a task ID to create a linked dependency on the new task",
      optional: true,
    },
    checkRequiredCustomFields: {
      type: "boolean",
      label: "Check Required Custom Fields",
      description:
        "Indicates whether or not your new task will include data for required Custom Fields (true) or not (false). The default is false. If you set this option to true, and do not include information for required Custom Fields, then you will receive an error that 'One or more required fields is missing'.",
      optional: true,
    },
    customFields: {
      type: "string[]",
      label: "Custom Fields",
      description: `An array of objects containing 'id' and 'value' keys.
        Example:
        {
          "id": "0a52c486-5f05-403b-b4fd-c512ff05131c",
          "value": 23
        },
      `,
      optional: true,
    },
  },
  async run() {
    const data = {
      name: this.name,
      description: this.description,
      assignees: this.assignees,
      tags: this.tags,
      status: this.status,
      priority: this.priority,
      due_date: this.dueDate,
      due_date_time: this.dueDateTime,
      time_estimate: this.timeEstimate,
      start_date: this.startDate,
      start_date_time: this.startDateTime,
      notify_all: this.notifyAll,
      parent: this.parent,
      links_to: this.linksTo,
      check_required_custom_fields: this.checkRequiredCustomFields,
      custom_fields: this.customFields,
    };
    return await this.clickup.createTask(this.list, data);
  },
};
