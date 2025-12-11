// Complete specification for AI Chat Message structure
// Based on adaptive card concept - flexible UI rendering from JSON

export type MessageRole = "user" | "assistant" | "system"

export type CodeLanguage = "python" | "javascript" | "typescript" | "sql" | "json" | "html" | "css" | "bash"

export type CodeExecutionStatus = "queued" | "running" | "success" | "error" | "idle"

export type ActionVerb = "openUrl" | "submitForm" | "rerunQuery" | "runAutomation" | "copyToClipboard" | "downloadFile"

export type ActionStatus = "idle" | "running" | "success" | "failed"

// Base Part interface
export interface BasePart {
  type: string
  id: string
}

// Text Part
export interface TextPart extends BasePart {
  type: "text"
  content: string
}

// Markdown Part
export interface MarkdownPart extends BasePart {
  type: "markdown"
  content: string
}

// Rich Text Part (HTML-like)
export interface RichTextPart extends BasePart {
  type: "richText"
  content: string
}

// Code Block Part
export interface CodePart extends BasePart {
  type: "code"
  language: CodeLanguage
  filename?: string
  content: string
  status?: CodeExecutionStatus
  output?: CodeOutput
}

export interface CodeOutput {
  type: "console_log" | "error" | "result"
  data: string
}

// Image Part
export interface ImagePart extends BasePart {
  type: "image"
  url: string
  altText: string
  caption?: string
  width?: number
  height?: number
}

// View Part (for custom data visualizations)
export interface ViewPart extends BasePart {
  type: "view"
  content: {
    viewType: "table" | "chart" | "list" | "grid" | "custom"
    data: any
    config?: Record<string, any>
  }
}

// Insight Part (for highlighting important information)
export interface InsightPart extends BasePart {
  type: "insight"
  content: {
    title: string
    description: string
    severity?: "info" | "warning" | "error" | "success"
    metrics?: Array<{
      label: string
      value: string | number
    }>
  }
}

// Union type for all parts
export type MessagePart = TextPart | MarkdownPart | RichTextPart | CodePart | ImagePart | ViewPart | InsightPart

// Action structure
export interface Action {
  id: string
  title: string
  verb: ActionVerb
  payload: Record<string, any>
  status?: ActionStatus
  output?: {
    type: string
    data: any
  }
}

// Main Message structure
export interface ChatMessage {
  type: "ui_message"
  version: string
  role?: MessageRole
  timestamp?: string
  parts: MessagePart[]
  actions?: Action[]
}

// Conversation structure
export interface Conversation {
  id: string
  title?: string
  messages: ChatMessage[]
  metadata?: Record<string, any>
}
