"use client"

import { useState, useEffect } from "react"
import { JsonEditor } from "@/components/json-editor"
import { ChatRenderer } from "@/components/chat-renderer"
import { exampleMessages } from "@/lib/example-messages"
import { chatMessageSchema } from "@/lib/schema-generator"
import type { ChatMessage } from "@/lib/types"
import { MessageSquare, Code2 } from "lucide-react"

export default function Home() {
  const [jsonValue, setJsonValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    // Initialize with example messages
    const initialJson = JSON.stringify(exampleMessages, null, 2)
    setJsonValue(initialJson)
    setMessages(exampleMessages)
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonValue(value)

    // Try to parse and update messages
    try {
      const parsed = JSON.parse(value)
      // Support both single message and array of messages
      const messageArray = Array.isArray(parsed) ? parsed : [parsed]
      setMessages(messageArray)
    } catch {
      // Invalid JSON, keep previous messages
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
          <JsonEditor value={jsonValue} onChange={handleJsonChange} schema={chatMessageSchema} />
        </div>

        {/* Right Panel - Chat Preview */}
        <div className="w-1/2">
          <ChatRenderer messages={messages} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Schema Version: 1.0.0</span>
          <span className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5" />
            {messages.length} message{messages.length !== 1 ? "s" : ""} loaded
          </span>
        </div>
      </footer>
    </div>
  )
}
