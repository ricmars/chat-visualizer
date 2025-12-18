"use client"

import { useState, useEffect } from "react"
import { JsonEditor } from "@/components/json-editor"
import { ChatRenderer } from "@/components/chat-renderer"
import { exampleConversation } from "@/lib/example-messages"
import conversationSchema from "@/lib/schemas/chat-message.schema.json"
import type { Conversation } from "@/lib/types"
import { MessageSquare, Code2 } from "lucide-react"

export default function Home() {
  const [jsonValue, setJsonValue] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    // Initialize with example conversation
    const initialJson = JSON.stringify(exampleConversation, null, 2)
    setJsonValue(initialJson)
    setConversation(exampleConversation)
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonValue(value)

    // Try to parse and update conversation
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && parsed.messages) {
        setConversation(parsed)
      }
    } catch {
      // Invalid JSON, keep previous conversation
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Chat Message Visualizer</h1>
              <p className="text-xs text-muted-foreground">Adaptive UI rendering from JSON schema</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - JSON Editor */}
        <div className="w-1/2 border-r border-border">
          <JsonEditor value={jsonValue} onChange={handleJsonChange} schema={conversationSchema} />
        </div>

        {/* Right Panel - Chat Preview */}
        <div className="w-1/2">
          <ChatRenderer messages={conversation?.messages || []} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Schema Version: 1.0.0</span>
          <span className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5" />
            {conversation?.messages.length || 0} message{(conversation?.messages.length || 0) !== 1 ? "s" : ""} loaded
          </span>
        </div>
      </footer>
    </div>
  )
}
