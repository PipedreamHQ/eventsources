const clickup = require("../../clickup.app.js");
const createTask = require("../create-task/create-task.js");

module.exports = {
  ...createTask,
  key: "clickup-create-subtask",
  name: "Create Subtask",
  description: "Creates a new subtask",
  version: "0.0.1",
  type: "action",
  props: {
    ...createTask.props,
    parent: {
      propDefinition: [
        clickup,
        "task",
        (c) => ({
          list: c.list,
        }),
      ],
      label: "Parent",
      description:
        "Pass an existing task ID in the parent property to make the new task a subtask of that parent. The parent you pass must not be a subtask itself, and must be part of the specified list.",
    },
  },
};
