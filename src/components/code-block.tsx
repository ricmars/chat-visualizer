"use client"

import type { CodePart } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  part: CodePart
}

export function CodeBlock({ part }: CodeBlockProps) {
  const statusIcons = {
    queued: Clock,
    running: Loader2,
    success: CheckCircle2,
    error: XCircle,
    idle: null,
  }

  const statusColors = {
    queued: "text-yellow-600",
    running: "text-blue-600",
    success: "text-emerald-600",
    error: "text-destructive",
    idle: "text-muted-foreground",
  }

  const StatusIcon = part.status ? statusIcons[part.status] : null

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {part.language}
          </Badge>
          {part.filename && <span className="text-xs text-muted-foreground">{part.filename}</span>}
        </div>
        {part.status && StatusIcon && (
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusColors[part.status])}>
            <StatusIcon className={cn("h-3.5 w-3.5", part.status === "running" && "animate-spin")} />
            {part.status}
          </div>
        )}
      </div>

      <pre className="overflow-x-auto bg-background p-4">
        <code className="text-sm leading-relaxed">{part.content}</code>
      </pre>

      {part.output && (
        <div
          className={cn(
            "border-t border-border p-3 text-xs",
            part.output.type === "error" ? "bg-destructive/5 text-destructive" : "bg-muted/30",
          )}
        >
          <div className="font-semibold">Output:</div>
          <pre className="mt-1 font-mono">{part.output.data}</pre>
        </div>
      )}
    </Card>
  )
}
