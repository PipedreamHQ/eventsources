// The Twist event types that can be subscribed to via webhook.
// The lines commented out are for event types listed in Twist's documentation,
// but not yet available. Coming Soon!

module.exports = [
  {
    label: "Workspace Added",
    value: "workspace_added",
  },
  {
    label: "Workspace Updated",
    value: "workspace_updated",
  },
  //  { label: "Workspace Deleted", value: `workspace_deleted` },
  {
    label: "Workspace User Added",
    value: "workspace_user_added",
  },
  {
    label: "Workspace User Updated",
    value: "workspace_user_updated",
  },
  {
    label: "Workspace User Removed",
    value: "workspace_user_removed",
  },
  {
    label: "Channel Added",
    value: "channel_added",
  },
  {
    label: "Channel Updated",
    value: "channel_updated",
  },
  {
    label: "Channel Deleted",
    value: "channel_deleted",
  },
  {
    label: "Channel User Added",
    value: "channel_user_added",
  },
  //  { label: "Channel User Updated", value: `channel_user_updated` },
  {
    label: "Channel User Removed",
    value: "channel_user_removed",
  },
  {
    label: "Thread Added",
    value: "thread_added",
  },
  {
    label: "Thread Updated",
    value: "thread_updated",
  },
  {
    label: "Thread Deleted",
    value: "thread_deleted",
  },
  {
    label: "Comment Added",
    value: "comment_added",
  },
  {
    label: "Comment Updated",
    value: "comment_updated",
  },
  {
    label: "Comment Deleted",
    value: "comment_deleted",
  },
  {
    label: "Message Added",
    value: "message_added",
  },
  {
    label: "Message Updated",
    value: "message_updated",
  },
  //  { label: "Message Deleted", value: `message_deleted` },
  {
    label: "Group Added",
    value: "group_added",
  },
  {
    label: "Group Updated",
    value: "group_updated",
  },
  {
    label: "Group Deleted",
    value: "group_deleted",
  },
  {
    label: "Group User Added",
    value: "group_user_added",
  },
  {
    label: "Group User Removed",
    value: "group_user_removed",
  },
];
