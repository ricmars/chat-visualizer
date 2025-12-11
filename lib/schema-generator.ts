// JSON Schema generator for ChatMessage types
export const chatMessageSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ChatMessage",
  description: "Schema for AI Chat Messages with adaptive UI rendering",
  type: "object",
  required: ["type", "version", "parts"],
  properties: {
    type: {
      type: "string",
      const: "ui_message",
      description: "Message type identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "Schema version (semantic versioning)",
      default: "1.0.0",
    },
    role: {
      type: "string",
      enum: ["user", "assistant", "system"],
      description: "Role of the message sender",
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 timestamp",
    },
    parts: {
      type: "array",
      minItems: 1,
      items: {
        oneOf: [
          {
            type: "object",
            required: ["type", "id", "content"],
            properties: {
              type: { const: "text" },
              id: { type: "string" },
              content: { type: "string" },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "content"],
            properties: {
              type: { const: "markdown" },
              id: { type: "string" },
              content: { type: "string" },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "content"],
            properties: {
              type: { const: "richText" },
              id: { type: "string" },
              content: { type: "string" },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "language", "content"],
            properties: {
              type: { const: "code" },
              id: { type: "string" },
              language: {
                type: "string",
                enum: ["python", "javascript", "typescript", "sql", "json", "html", "css", "bash"],
              },
              filename: { type: "string" },
              content: { type: "string" },
              status: {
                type: "string",
                enum: ["queued", "running", "success", "error", "idle"],
              },
              output: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["console_log", "error", "result"],
                  },
                  data: { type: "string" },
                },
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "url", "altText"],
            properties: {
              type: { const: "image" },
              id: { type: "string" },
              url: { type: "string", format: "uri" },
              altText: { type: "string" },
              caption: { type: "string" },
              width: { type: "number" },
              height: { type: "number" },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "content"],
            properties: {
              type: { const: "view" },
              id: { type: "string" },
              content: {
                type: "object",
                required: ["viewType", "data"],
                properties: {
                  viewType: {
                    type: "string",
                    enum: ["table", "chart", "list", "grid", "custom"],
                  },
                  data: {},
                  config: { type: "object" },
                },
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "id", "content"],
            properties: {
              type: { const: "insight" },
              id: { type: "string" },
              content: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: {
                    type: "string",
                    enum: ["info", "warning", "error", "success"],
                  },
                  metrics: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["label", "value"],
                      properties: {
                        label: { type: "string" },
                        value: { type: ["string", "number"] },
                      },
                    },
                  },
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "verb", "payload"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          verb: {
            type: "string",
            enum: ["openUrl", "submitForm", "rerunQuery", "runAutomation", "copyToClipboard", "downloadFile"],
          },
          payload: { type: "object" },
          status: {
            type: "string",
            enum: ["idle", "running", "success", "failed"],
          },
          output: {
            type: "object",
            properties: {
              type: { type: "string" },
              data: {},
            },
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
}

export const conversationSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Conversation",
  description: "Schema for a conversation containing multiple chat messages",
  type: "object",
  required: ["id", "messages"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    messages: {
      type: "array",
      items: { $ref: "#/definitions/ChatMessage" },
    },
    metadata: { type: "object" },
  },
  definitions: {
    ChatMessage: chatMessageSchema,
  },
}
