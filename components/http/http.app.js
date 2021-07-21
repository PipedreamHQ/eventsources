module.exports = {
  type: "app",
  app: "http",
  propDefinitions: {
    url: {
      type: "string",
      label: "URL",
    },
    method: {
      type: "string",
      options: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "COPY",
        "HEAD",
        "OPTIONS",
        "LINK",
        "UNLINK",
        "PURGE",
        "LOCK",
        "UNLOCK",
        "PROPFIND",
        "VIEW",
      ],
    },
    body: {
      type: "string",
      description: "Enter a string or add an expression in curly brackets `{{...}}`. To reference data from an earlier step, enter it in curly brackets (e.g., `{{steps.foo.$return_value}}`).",
      optional: true,
    },
    params: {
      type: "object",
      description: "Add individual query parameters as key-value pairs or disable structured mode to pass multiple key-value pairs as an object.",
      optional: true,
    },
    headers: {
      type: "object",
      description: "Add headers as key-value pairs",
      optional: true,
    },
    auth: {
      type: "object",
      optional: true,
    },
    responseType: {
      type: "string",
      options: [
        "json",
        "arraybuffer",
        "document",
        "text",
        "stream",
      ],
      optional: true,
    },
  },
};
