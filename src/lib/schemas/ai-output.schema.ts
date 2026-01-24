// AI Output Schema for OpenAI Structured Outputs
// This is a simplified schema optimized for AI generation
// It maps directly to our ChatMessage type but is formatted for OpenAI's response_format

import type { PlatformType } from "../transformers/types";

/**
 * Schema for OpenAI Structured Outputs
 * This schema is designed to be compatible with OpenAI's json_schema response format
 * while generating valid ChatMessage objects
 */
export const chatMessageOutputSchema = {
  name: "chat_message",
  strict: false,
  schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["ui_message"],
        description: "Message type identifier"
      },
      version: {
        type: "string",
        description: "Schema version"
      },
      timestamp: {
        type: "string",
        description: "ISO 8601 timestamp"
      },
      case: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique case identifier (e.g., CA-1234)"
          },
          name: {
            type: "string",
            description: "Human-readable case name"
          },
          status: {
            type: "string",
            description: "Current stage ID - must match one of the stage IDs"
          },
          stages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique stage identifier"
                },
                name: {
                  type: "string",
                  description: "Human-readable stage name"
                }
              },
              required: ["id", "name"],
              additionalProperties: false
            },
            description: "Ordered list of workflow stages"
          }
        },
        required: ["id", "name", "status", "stages"],
        additionalProperties: false,
        description: "Case/workflow information if this message relates to a case"
      },
      parts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["text", "markdown", "code", "image", "insight", "view", "case"],
              description: "Part type"
            },
            id: {
              type: "string",
              description: "Unique part identifier"
            },
            role: {
              type: "string",
              enum: ["user", "assistant", "system"],
              description: "Who created this part"
            },
            content: {
              type: ["string", "object"],
              description: "Part content - string for text/markdown/code, object for insight/view"
            },
            language: {
              type: "string",
              enum: ["python", "javascript", "typescript", "sql", "json", "html", "css", "bash"],
              description: "For code parts only"
            },
            filename: {
              type: "string",
              description: "For code parts only"
            },
            url: {
              type: "string",
              description: "For image parts only"
            },
            altText: {
              type: "string",
              description: "For image parts only"
            },
            caption: {
              type: "string",
              description: "For image parts only"
            },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  verb: {
                    type: "string",
                    enum: ["openUrl", "submitForm", "rerunQuery", "runAutomation", "copyToClipboard", "downloadFile"]
                  },
                  payload: {
                    type: "object",
                    additionalProperties: true
                  }
                },
                required: ["id", "title", "verb"],
                additionalProperties: false
              },
              description: "Interactive actions for this part"
            }
          },
          required: ["type", "id"],
          additionalProperties: false
        },
        description: "Message parts - the actual content"
      }
    },
    required: ["type", "version", "parts"],
    additionalProperties: false
  }
} as const;

/**
 * Schema specifically for insight content
 */
export const insightContentSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    severity: {
      type: "string",
      enum: ["info", "warning", "error", "success"]
    },
    metrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: ["string", "number"] }
        },
        required: ["label", "value"]
      }
    }
  },
  required: ["title", "description"]
} as const;

/**
 * Schema specifically for view content
 */
export const viewContentSchema = {
  type: "object",
  properties: {
    viewType: {
      type: "string",
      enum: ["table", "chart", "list", "grid", "custom"]
    },
    data: {
      description: "The data to display"
    },
    config: {
      type: "object",
      additionalProperties: true
    }
  },
  required: ["viewType", "data"]
} as const;

/**
 * System prompt for structured output generation
 */
export const STRUCTURED_OUTPUT_SYSTEM_PROMPT = `You are an AI assistant that generates structured JSON responses for a rich chat interface.

## Response Format

You MUST respond with a valid ChatMessage JSON object. The response will be parsed and rendered as a rich UI.

## Available Part Types

1. **text** - Simple text message
   - content: string
   
2. **markdown** - Formatted text with markdown
   - content: string (markdown formatted)
   
3. **code** - Code block with syntax highlighting
   - content: string (the code)
   - language: "python" | "javascript" | "typescript" | "sql" | "json" | "html" | "css" | "bash"
   - filename: optional string
   
4. **image** - Image display
   - url: string
   - altText: string
   - caption: optional string
   
5. **insight** - Highlighted information card
   - content: { title, description, severity?, metrics?: [{label, value}] }
   
6. **view** - Data visualization
   - content: { viewType: "table"|"list"|"chart", data: array, config?: object }
   
7. **case** - Case workflow indicator (use with message.case)
   - No additional content needed, references message.case

## Case/Workflow

When the user is working on a case/workflow, include the "case" field at the message level with:
- id: Unique identifier (e.g., "CA-1234")
- name: Case name
- status: Current stage ID (must match one of stages[].id)
- stages: Array of {id, name} representing the workflow

Then include a "case" type part in the parts array to display the workflow.

## Actions

Any part can have an "actions" array with buttons:
- id: Unique action ID
- title: Button label
- verb: "submitForm" | "openUrl" | "rerunQuery" | etc.
- payload: Optional data object

## Example Response

\`\`\`json
{
  "type": "ui_message",
  "version": "1.0",
  "case": {
    "id": "CA-1234",
    "name": "Marketing Campaign",
    "status": "planning",
    "stages": [
      {"id": "intake", "name": "Intake"},
      {"id": "planning", "name": "Planning"},
      {"id": "execution", "name": "Execution"}
    ]
  },
  "parts": [
    {
      "type": "case",
      "id": "case-display",
      "role": "assistant"
    },
    {
      "type": "markdown",
      "id": "main-content",
      "role": "assistant",
      "content": "## Campaign Created\\n\\nI've set up your campaign..."
    }
  ]
}
\`\`\`

Always include "type": "ui_message" and "version": "1.0".
Always include at least one part in the parts array.
Use appropriate part types to create rich, informative responses.`;

// =============================================================================
// FORMAT-SPECIFIC SCHEMAS AND PROMPTS
// =============================================================================

/**
 * JSON Schema for Google A2UI Document output
 */
export const a2uiDocumentOutputSchema = {
  name: "a2ui_document",
  strict: false,
  schema: {
    type: "object",
    properties: {
      "@context": {
        type: "string",
        enum: ["https://schema.google.com/a2ui"],
      },
      "@type": {
        type: "string",
        enum: ["Document"],
      },
      version: {
        type: "string",
      },
      elements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            "@type": {
              type: "string",
              description: "Element type: TextBlock, Heading, MarkdownBlock, CodeBlock, Alert, Card, Image, DataTable, PropertyList, Property, ProgressStepper, MetricSet, Metric, ActionGroup, Action, Form, TextField, SelectField, TextArea"
            },
            id: { type: "string" },
            content: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "object" } }
              ],
            },
            properties: {
              type: "object",
              additionalProperties: true,
            },
            style: {
              type: "object",
              properties: {
                variant: { type: "string" },
                size: { type: "string" },
                color: { type: "string" },
              },
            },
            name: { type: "string" },
            label: { type: "string" },
            parameters: { type: "object" },
          },
          required: ["@type"],
        },
      },
    },
    required: ["@type", "version", "elements"],
  },
} as const;

/**
 * JSON Schema for json-render Tree output
 */
export const jsonRenderOutputSchema = {
  name: "json_render_tree",
  strict: false,
  schema: {
    type: "object",
    properties: {
      $schema: { type: "string" },
      version: { type: "string" },
      root: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Component type: Container, Card, Text, Markdown, CodeBlock, Image, Table, List, Chart, MetricGrid, Metric, Button, Stepper, Output, Status, DataView"
          },
          props: {
            type: "object",
            additionalProperties: true,
          },
          children: {
            type: "array",
            items: { type: "object" },
          },
          actions: {
            type: "object",
            properties: {
              name: { type: "string" },
              params: { type: "object" },
            },
          },
        },
        required: ["type", "props"],
      },
    },
    required: ["version", "root"],
  },
} as const;

/**
 * JSON Schema for Adaptive Card output
 */
export const adaptiveCardOutputSchema = {
  name: "adaptive_card",
  strict: false,
  schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["AdaptiveCard"],
      },
      $schema: { type: "string" },
      version: { type: "string" },
      body: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Element type: TextBlock, RichTextBlock, Image, Container, ColumnSet, Column, FactSet, CodeBlock"
            },
            text: { type: "string" },
            url: { type: "string" },
            altText: { type: "string" },
            // Container items - nested elements
            items: { 
              type: "array",
              items: { type: "object", additionalProperties: true }
            },
            // ColumnSet columns
            columns: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["Column"] },
                  width: { type: "string" },
                  items: { 
                    type: "array",
                    items: { type: "object", additionalProperties: true }
                  },
                },
              }
            },
            // FactSet facts
            facts: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  value: { type: "string" },
                },
                required: ["title", "value"],
              }
            },
            codeSnippet: { type: "string" },
            language: { type: "string" },
            wrap: { type: "boolean" },
            weight: { type: "string" },
            size: { type: "string" },
            color: { type: "string" },
            style: { type: "string" },
            spacing: { type: "string" },
            isSubtle: { type: "boolean" },
            horizontalAlignment: { type: "string" },
          },
          required: ["type"],
        },
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["Action.Submit", "Action.OpenUrl", "Action.ShowCard"],
            },
            title: { type: "string" },
            data: { type: "object", additionalProperties: true },
            url: { type: "string" },
          },
          required: ["type", "title"],
        },
      },
    },
    required: ["type", "version", "body"],
  },
} as const;

/**
 * System prompt for Google A2UI format
 */
export const A2UI_SYSTEM_PROMPT = `You are an AI assistant that generates Google A2UI format JSON responses for a rich chat interface.

## Response Format

You MUST respond with a valid A2UI Document JSON object. The response will be parsed and rendered as a rich UI.

## A2UI Document Structure

\`\`\`json
{
  "@context": "https://schema.google.com/a2ui",
  "@type": "Document",
  "version": "1.0",
  "elements": [...]
}
\`\`\`

## Available Element Types

1. **TextBlock** - Simple text
   - content: string
   - style: { variant: "user-message" | "assistant-message", color: "primary" | "neutral" }

2. **Heading** - Headers
   - content: string
   - style: { size: "sm" | "md" | "lg" | "xl" }

3. **MarkdownBlock** - Formatted text with markdown
   - content: string (markdown)

4. **CodeBlock** - Code with syntax highlighting
   - content: string (code)
   - properties: { language: string, filename?: string, lineNumbers?: boolean }

5. **OutputBlock** - Output display
   - content: string
   - style: { variant: "success" | "error" }

6. **Alert** - Highlighted information
   - content: [child elements]
   - style: { variant: "informational" | "positive" | "cautionary" | "critical" }

7. **Card** - Container card
   - content: [child elements]
   - style: { variant: "elevated" }

8. **PropertyList** - Key-value pairs container
   - content: [Property elements]

9. **Property** - Key-value pair
   - properties: { label: string, value: string }

10. **MetricSet** - Metrics container
    - content: [Metric elements]

11. **Metric** - Single metric
    - properties: { label: string, value: string }

12. **DataTable** - Table
    - properties: { columns: [{key, label}], rows: [data objects] }

13. **Image** - Image
    - properties: { src: string, alt: string }

14. **ProgressStepper** - Workflow progress
    - properties: { steps: [{id, label, completed, current}], orientation: "horizontal" | "vertical" }

15. **ActionGroup** - Button container
    - content: [Action elements]

16. **Action** - Button
    - name: string (action identifier)
    - label: string (button text)
    - style: { variant: "primary" }

17. **Form** - Form container
    - content: [form field elements]

18. **TextField** - Text input
    - id: string
    - properties: { label: string, placeholder?: string, required?: boolean }

19. **SelectField** - Dropdown
    - id: string
    - properties: { label: string, options: [{value, label}], required?: boolean }

## Example Response

\`\`\`json
{
  "@context": "https://schema.google.com/a2ui",
  "@type": "Document",
  "version": "1.0",
  "elements": [
    {
      "@type": "Card",
      "id": "main-card",
      "content": [
        {
          "@type": "Heading",
          "content": "Marketing Campaign Created",
          "style": { "size": "lg" }
        },
        {
          "@type": "PropertyList",
          "content": [
            { "@type": "Property", "properties": { "label": "Campaign ID", "value": "CA-001" } },
            { "@type": "Property", "properties": { "label": "Status", "value": "Active" } }
          ]
        },
        {
          "@type": "MarkdownBlock",
          "content": "Your campaign has been set up with the following configuration..."
        }
      ],
      "style": { "variant": "elevated" }
    },
    {
      "@type": "ProgressStepper",
      "id": "workflow-steps",
      "properties": {
        "steps": [
          { "id": "planning", "label": "Planning", "completed": true, "current": false },
          { "id": "content", "label": "Content", "completed": false, "current": true },
          { "id": "launch", "label": "Launch", "completed": false, "current": false }
        ],
        "orientation": "horizontal"
      }
    }
  ]
}
\`\`\`

Always include "@context": "https://schema.google.com/a2ui", "@type": "Document", and "version": "1.0".
Always include at least one element in the elements array.`;

/**
 * System prompt for json-render format
 */
export const JSON_RENDER_SYSTEM_PROMPT = `You are an AI assistant that generates json-render format JSON responses for a rich chat interface.

## Response Format

You MUST respond with a valid json-render Tree JSON object. The response will be parsed and rendered as a rich UI.

## json-render Tree Structure

\`\`\`json
{
  "$schema": "https://json-render.dev/schemas/tree.json",
  "version": "1.0",
  "root": {
    "type": "Container",
    "props": { "direction": "column", "gap": "md" },
    "children": [...]
  }
}
\`\`\`

## Available Component Types

1. **Container** - Layout container
   - props: { direction: "column" | "row", gap: "xs" | "sm" | "md" | "lg" | "xl", className?: string }
   - children: array of child elements

2. **Card** - Card container
   - props: { variant: "default" | "success" | "warning" | "error" | "info" | "elevated" }
   - children: array of child elements

3. **Text** - Text display
   - props: { content: string, variant: "heading" | "subheading" | "body" | "caption" | "user" }

4. **Markdown** - Markdown content
   - props: { content: string }

5. **CodeBlock** - Code with syntax highlighting
   - props: { code: string, language: string, filename?: string, showLineNumbers?: boolean }

6. **Output** - Output display
   - props: { content: string, variant: "success" | "error" }

7. **Status** - Status badge
   - props: { status: "running" | "completed" | "error", label?: string }

8. **Image** - Image
   - props: { src: string, alt: string }

9. **Table** - Data table
   - props: { columns: [{key, header, sortable?}], data: [row objects], striped?: boolean, hoverable?: boolean }

10. **List** - List
    - props: { items: [{content}], variant: "bullet" | "ordered" }

11. **Chart** - Chart placeholder
    - props: { chartType: "bar" | "line" | "pie", data: object, config?: object }

12. **MetricGrid** - Metrics grid
    - props: { metrics: [{label, value, unit?, trend?: "up" | "down"}] }

13. **Metric** - Single metric
    - props: { label: string, value: string | number, unit?: string, trend?: "up" | "down" }

14. **Stepper** - Workflow stepper
    - props: { steps: [{id, label, status: "completed" | "current" | "pending"}], currentStep?: number }

15. **Button** - Action button
    - props: { label: string, variant: "primary" | "secondary" | "destructive", disabled?: boolean }
    - actions: { name: string, params?: object }

16. **DataView** - Generic data view
    - props: { viewType: string, data: any }

## Example Response

\`\`\`json
{
  "$schema": "https://json-render.dev/schemas/tree.json",
  "version": "1.0",
  "root": {
    "type": "Container",
    "props": { "direction": "column", "gap": "md" },
    "children": [
      {
        "type": "Card",
        "props": { "variant": "elevated" },
        "children": [
          {
            "type": "Text",
            "props": { "content": "Marketing Campaign", "variant": "heading" }
          },
          {
            "type": "MetricGrid",
            "props": {
              "metrics": [
                { "label": "Campaign ID", "value": "CA-001" },
                { "label": "Status", "value": "Active" }
              ]
            }
          }
        ]
      },
      {
        "type": "Stepper",
        "props": {
          "steps": [
            { "id": "planning", "label": "Planning", "status": "completed" },
            { "id": "content", "label": "Content", "status": "current" },
            { "id": "launch", "label": "Launch", "status": "pending" }
          ]
        }
      },
      {
        "type": "Markdown",
        "props": { "content": "## Next Steps\\n\\n- Define target audience\\n- Create content plan" }
      }
    ]
  }
}
\`\`\`

Always include "version": "1.0" and a "root" element.
The root element is typically a Container with children.`;

/**
 * System prompt for Adaptive Cards format
 */
export const ADAPTIVE_CARDS_SYSTEM_PROMPT = `You are an AI assistant that generates Microsoft Adaptive Cards format JSON responses for a rich chat interface.

## Response Format

You MUST respond with a valid AdaptiveCard JSON object. The response will be parsed and rendered as a rich UI.

## Adaptive Card Structure

\`\`\`json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [...],
  "actions": [...]
}
\`\`\`

## Available Element Types for body[]

1. **TextBlock** - Text display
   - text: string
   - wrap: boolean (default true)
   - weight: "Default" | "Lighter" | "Bolder"
   - size: "Default" | "Small" | "Medium" | "Large" | "ExtraLarge"
   - color: "Default" | "Dark" | "Light" | "Accent" | "Good" | "Warning" | "Attention"
   - isSubtle: boolean

2. **CodeBlock** - Code display
   - codeSnippet: string
   - language: string

3. **Image** - Image display
   - url: string
   - altText: string
   - size: "Auto" | "Stretch" | "Small" | "Medium" | "Large"
   - horizontalAlignment: "Left" | "Center" | "Right"

4. **Container** - Element container
   - items: array of elements
   - style: "default" | "emphasis" | "good" | "attention" | "warning" | "accent"
   - spacing: string

5. **ColumnSet** - Column layout
   - columns: array of Column objects

6. **Column** - Single column
   - width: "auto" | "stretch" | percentage
   - items: array of elements

7. **FactSet** - Key-value pairs
   - facts: array of { title: string, value: string }

## Available Action Types for actions[]

1. **Action.Submit** - Submit data
   - title: string
   - data: object

2. **Action.OpenUrl** - Open URL
   - title: string
   - url: string

## Example Response

\`\`\`json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "style": "accent",
      "items": [
        {
          "type": "TextBlock",
          "text": "Marketing Campaign Created",
          "weight": "Bolder",
          "size": "Large"
        },
        {
          "type": "FactSet",
          "facts": [
            { "title": "Campaign ID", "value": "CA-001" },
            { "title": "Status", "value": "Active" },
            { "title": "Created", "value": "Today" }
          ]
        }
      ]
    },
    {
      "type": "TextBlock",
      "text": "Your campaign has been configured with the following settings...",
      "wrap": true
    },
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "auto",
          "items": [
            { "type": "TextBlock", "text": "✅ Planning", "color": "Good", "size": "Small" }
          ]
        },
        {
          "type": "Column",
          "width": "auto",
          "items": [
            { "type": "TextBlock", "text": "🔵 Content", "color": "Accent", "weight": "Bolder", "size": "Small" }
          ]
        },
        {
          "type": "Column",
          "width": "auto",
          "items": [
            { "type": "TextBlock", "text": "⚪ Launch", "size": "Small" }
          ]
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Continue Setup",
      "data": { "action": "continue" }
    }
  ]
}
\`\`\`

Always include "type": "AdaptiveCard", "version": "1.5", and a "body" array.
Adaptive Cards support markdown in TextBlock text field for basic formatting.`;

/**
 * Get the output schema for a given platform
 */
export function getOutputSchemaForPlatform(platform: PlatformType) {
  switch (platform) {
    case "google-a2ui":
      return a2uiDocumentOutputSchema;
    case "json-render":
      return jsonRenderOutputSchema;
    case "adaptive-cards":
      return adaptiveCardOutputSchema;
    case "pega":
    default:
      return chatMessageOutputSchema;
  }
}

/**
 * Get the system prompt for a given platform
 */
export function getSystemPromptForPlatform(platform: PlatformType): string {
  const domainContext = `\n\n## Domain Context

You are a marketing campaign assistant. When users want to create campaigns:
1. Create a workflow with stages: Planning → Content Creation → Setup → Launch → Optimization → Analysis
2. Use highlighted information cards/alerts to show important information
3. Use tables for structured data (audiences, content plans)
4. Use markdown for formatted explanations
5. Show workflow progress when working on campaign tasks`;

  switch (platform) {
    case "google-a2ui":
      return A2UI_SYSTEM_PROMPT + domainContext;
    case "json-render":
      return JSON_RENDER_SYSTEM_PROMPT + domainContext;
    case "adaptive-cards":
      return ADAPTIVE_CARDS_SYSTEM_PROMPT + domainContext;
    case "pega":
    default:
      return STRUCTURED_OUTPUT_SYSTEM_PROMPT + domainContext;
  }
}
