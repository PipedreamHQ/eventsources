const common = require("../common");
const { clubhouse } = common.props;
const validate = require("validate.js");

module.exports = {
  key: "clubhouse-create-story",
  name: "Create Story",
  description: "Creates a new story in your clubhouse.",
  version: "0.0.1",
  type: "action",
  props: {
    clubhouse,
    archived: {
      type: "boolean",
      label: "Archived",
      description: "Controls the story’s archived state.",
      optional: true,
    },
    comments: {
      type: "object",
      label: "Comments",
      description:
        "An array with comments to add to the story. Each comment must have the [CreateStoryCommentParams](https://clubhouse.io/api/rest/v3/#CreateStoryCommentParams) structure.",
      optional: true,
    },
    completedAtOverride: {
      type: "string",
      label: "Completed at Override Date",
      description:
        "A manual override for the time/date the Story was completed.",
      optional: true,
    },
    createdAt: {
      type: "string",
      label: "Created at Date",
      description: "The time/date the Story was created.",
      optional: true,
    },
    dueDate: {
      type: "string",
      label: "Due Date",
      description: "The due date of the story.",
      optional: true,
    },
    description: {
      type: "string",
      label: "Description",
      description: "The description of the story.",
      optional: true,
    },
    epicId: {
      type: "integer",
      label: "Epic ID",
      description: "The unique identifier of the epic the story belongs to.",
      optional: true,
    },
    estimate: {
      type: "integer",
      label: "Estimate",
      description:
        "The numeric point estimate of the story. Can also be null, which means unestimated.",
      optional: true,
    },
    externalId: {
      type: "integer",
      label: "External Id",
      description:
        "This field can be set to another unique ID. In the case that the Story has been imported from another tool, the ID in the other tool can be indicated here.",
      optional: true,
    },
    externalLinks: {
      type: "object",
      label: "External Links",
      description: "An array of External Links associated with this story.",
      optional: true,
    },
    fileIds: {
      type: "object",
      label: "File Ids",
      description: "An array of IDs of files attached to the story.",
      optional: true,
    },
    followerIds: {
      type: "object",
      label: "Follower Ids",
      description: "An array of UUIDs of the followers of this story.",
      optional: true,
    },
    groupId: {
      type: "string",
      label: "Group Id",
      description: "The id of the group to associate with this story.",
      optional: true,
    },
    iterationId: {
      type: "integer",
      label: "Iteration Id",
      description: "The ID of the iteration the story belongs to.",
      optional: true,
    },
    labels: {
      type: "object",
      label: "Labels",
      description:
        "An array of labels attached to the story. Each label must have the [CreateLabelParams](https://clubhouse.io/api/rest/v3/#CreateLabelParams) structure.",
      optional: true,
    },
    linkedFileIds: {
      type: "object",
      label: "Linked File Ids",
      description:
        "An array of integers with the IDs of linked files attached to the story.",
      optional: true,
    },
    name: {
      type: "string",
      label: "Name",
      description: "The name of the story.",
    },
    ownerIds: {
      type: "object",
      label: "Owner Ids",
      description: "An array of UUIDs of the owners of this story.",
      optional: true,
    },
    projectId: {
      type: "integer",
      label: "Project Id",
      description: "The ID of the project the story belongs to.",
    },
    requestedById: {
      type: "string",
      label: "Requested by ID",
      description: "The ID of the member that requested the story.",
      optional: true,
    },
    startedAtOverride: {
      type: "string",
      label: "Started at Override Date",
      description: "A manual override for the time/date the Story was started.",
      optional: true,
    },
    storyLinks: {
      type: "object",
      label: "Story Links",
      description:
        "An array of story links attached to the story. Each story link must have the [CreateStoryLinkParams](https://clubhouse.io/api/rest/v3/#Body-Parameters-34268) structure.",
      optional: true,
    },
    storyType: {
      type: "string",
      label: "Story Type",
      description: "The type of story (feature, bug, chore).",
      options: ["bug", "chore", "feature"],
      optional: true,
    },
    tasks: {
      type: "object",
      label: "Story Links",
      description:
        "An array of tasks connected to the story. Each task must have the [CreateTaskParams](https://clubhouse.io/api/rest/v3/#CreateTaskParams) structure.",
      optional: true,
    },
    updatedAt: {
      type: "string",
      label: "Updated at Date",
      description: "The time/date the story was updated.",
      optional: true,
    },
    workflowStateId: {
      type: "integer",
      label: "Workflow State Id",
      description: "The ID of the workflow state the story will be in.",
      optional: true,
    },
  },
  methods: {
    ...common.methods,
  },
  async run() {
    const constraints = {
      name: {
        presence: true,
        length: { maximum: 512 },
      },
      projectId: {
        presence: true,
      },
      description: {
        length: { maximum: 100000 },
      },
    };
    if (this.externalLinks) {
      constraints.externalLinks = {
        type: "array",
      };
    }
    if (this.fileIds) {
      constraints.fileIds = {
        type: "array",
      };
    }
    if (this.followerIds) {
      constraints.followerIds = {
        type: "array",
      };
    }
    if (this.labels) {
      constraints.labels = {
        type: "array",
      };
    }
    if (this.linkedFileIds) {
      constraints.linkedFileIds = {
        type: "array",
      };
    }
    if (this.ownerIds) {
      constraints.ownerIds = {
        type: "array",
      };
    }
    if (this.storyLinks) {
      constraints.storyLinks = {
        type: "array",
      };
    }
    if (this.tasks) {
      constraints.tasks = { type: "array" };
    }
    const validationResult = validate(
      {
        name: this.name,
        projectId: this.projectId,
        description: this.description,
        externalLinks: this.externalLinks,
        fileIds: this.fileIds,
        followerIds: this.followerIds,
        labels: this.labels,
        linkedFileIds: this.linkedFileIds,
        ownerIds: this.ownerIds,
        storyLinks: this.storyLinks,
        tasks: this.tasks,
      },
      constraints
    );
    if (validationResult) {
      const validationMessages = this.getValidationMessage(validationResult);
      throw new Error(validationMessages);
    }
    return await this.clubhouse.createStory(
      this.archived,
      this.comments,
      this.completedAtOverride,
      this.createdAt,
      this.dueDate,
      this.description,
      this.epicId,
      this.estimate,
      this.externalId,
      this.externalLinks,
      this.fileIds,
      this.followerIds,
      this.groupId,
      this.iterationId,
      this.labels,
      this.linkedFileIds,
      this.name,
      this.ownerIds,
      this.projectId,
      this.requestedById,
      this.startedAtOverride,
      this.storyLinks,
      this.storyType,
      this.tasks,
      this.updatedAt,
      this.workflowStateId
    );
  },
};
