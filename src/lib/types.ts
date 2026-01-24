// Complete specification for AI Chat Message structure
// Based on adaptive card concept - flexible UI rendering from JSON

export type MessageRole = "user" | "assistant" | "system"

export type CodeLanguage = "python" | "javascript" | "typescript" | "sql" | "json" | "html" | "css" | "bash"

export type CodeExecutionStatus = "queued" | "running" | "success" | "error" | "idle"

export type ActionVerb = "openUrl" | "submitForm" | "rerunQuery" | "runAutomation" | "copyToClipboard" | "downloadFile"

export type ActionStatus = "idle" | "running" | "success" | "failed"

// Case Status type - can be updated in real time through JSON updates
// The status should match one of the stage IDs, indicating the current active stage
export type CaseStatus = string

// Case Stage interface
export interface CaseStage {
  id: string
  name: string
}

// Case interface
export interface Case {
  id: string
  name: string
  status: CaseStatus // Maps to one of the stage IDs - all previous stages are completed, this one is active
  stages: CaseStage[]
}

// Base Part interface
export interface BasePart {
  type: string
  id: string
  role?: MessageRole
  actions?: Action[]
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
      unit?: string
      trend?: "up" | "down" | "neutral"
    }>
  }
}

// Case Part (for displaying case information)
// The case data (id, name, status, stages) is stored at the message level
// This part just indicates that the message should display case information
export interface CasePart extends BasePart {
  type: "case"
  // Content can be empty or contain additional case-specific data
  content?: Record<string, any>
}

// Union type for all parts
export type MessagePart = TextPart | MarkdownPart | RichTextPart | CodePart | ImagePart | ViewPart | InsightPart | CasePart

// Action structure
export interface Action {
  id: string
  title: string
  verb: ActionVerb
  payload?: Record<string, any>
  status?: ActionStatus
  style?: "primary" | "secondary" | "danger"
  disabled?: boolean
  output?: {
    type: string
    data: any
  }
}

// Main Message structure
export interface ChatMessage {
  type: "ui_message"
  version: string
  timestamp?: string
  parts: MessagePart[]
  // Case metadata - when present, indicates this message is related to a case
  // Multiple messages can reference the same case
  case?: Case
}

// Conversation structure
export interface Conversation {
  id: string
  title?: string
  messages: ChatMessage[]
  metadata?: Record<string, any>
}
