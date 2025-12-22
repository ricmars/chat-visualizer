"use client"

import type { ChatMessage, MessagePart } from "@/lib/types"
import { CodeBlock } from "@/components/code-block"
import { ImagePart } from "@/components/image-part"
import { InsightCard } from "@/components/insight-card"
import { ViewPart } from "@/components/view-part"
import { ActionButtons } from "@/components/action-buttons"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface ChatRendererProps {
  messages: ChatMessage[]
}

export function ChatRenderer({ messages }: ChatRendererProps) {
  return (
    <div className="flex h-full flex-col" style={{ background: "#EAECF6" }}>
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <h2 className="text-sm font-semibold">Chat Preview</h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] space-y-3", isUser ? "items-end" : "items-start")}>
        {message.parts.map((part) => (
          <PartRenderer key={part.id} part={part} isUser={isUser} />
        ))}

        {message.actions && message.actions.length > 0 && <ActionButtons actions={message.actions} />}
      </div>
    </div>
  )
}

function PartRenderer({ part, isUser }: { part: MessagePart; isUser: boolean }) {
  const baseClasses = cn("rounded-lg", !isUser && "bg-muted")
  
  const userMessageStyle: React.CSSProperties = isUser ? {
    display: "flex",
    padding: "6px 14px",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
    borderRadius: "20px 5px 20px 20px",
    background: "#3F57E4",
    color: "white"
  } : {}

  switch (part.type) {
    case "text":
      return (
        <div 
          className={cn(baseClasses, !isUser && "px-4 py-2.5")}
          style={userMessageStyle}
        >
          <p className="text-sm leading-relaxed">{part.content}</p>
        </div>
      )

    case "markdown":
      return (
        <div className={cn("prose prose-sm max-w-none rounded-lg bg-muted p-4")}>
          <ReactMarkdown>{part.content}</ReactMarkdown>
        </div>
      )

    case "richText":
      return (
        <div 
          className={cn(baseClasses, !isUser && "px-4 py-2.5")}
          style={userMessageStyle}
          dangerouslySetInnerHTML={{ __html: part.content }} 
        />
      )

    case "code":
      return <CodeBlock part={part} />

    case "image":
      return <ImagePart part={part} />

    case "insight":
      return <InsightCard part={part} />

    case "view":
      return <ViewPart part={part} />

    default:
      return null
  }
}
