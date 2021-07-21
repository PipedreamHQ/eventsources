const clickup = require("../clickup.app.js");

module.exports = {
  props: {
    clickup,
    workspace: {
      propDefinition: [
        clickup,
        "workspace",
      ],
    },
    space: {
      propDefinition: [
        clickup,
        "space",
        (c) => ({
          workspace: c.workspace,
        }),
      ],
    },
    folder: {
      propDefinition: [
        clickup,
        "folder",
        (c) => ({
          space: c.space,
        }),
      ],
    },
    priority: {
      propDefinition: [
        clickup,
        "priority",
      ],
    },
  },
};
