"use client"

import { useState } from "react"
import type { Action } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonsProps {
  actions: Action[]
}

export function ActionButtons({ actions }: ActionButtonsProps) {
  const [actionStates, setActionStates] = useState<Record<string, string>>(
    Object.fromEntries(actions.map((a) => [a.id, a.status || "idle"])),
  )

  const handleAction = (action: Action) => {
    console.log("[v0] Action triggered:", action.verb, action.payload)

    // Simulate action execution
    setActionStates((prev) => ({ ...prev, [action.id]: "running" }))

    setTimeout(() => {
      setActionStates((prev) => ({ ...prev, [action.id]: "success" }))
    }, 1500)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const status = actionStates[action.id]

        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleAction(action)}
            disabled={status === "running"}
            className={cn(
              "gap-2",
              status === "success" && "border-emerald-600 text-emerald-600",
              status === "failed" && "border-destructive text-destructive",
            )}
            style={{
              display: "flex",
              height: "32px",
              padding: "0 16px",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              borderRadius: "20px 5px 20px 20px",
              border: "1px solid #3F57E4",
              background: "#FFF",
              color: "#3F57E4",
            }}
          >
            {status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {status === "failed" && <XCircle className="h-3.5 w-3.5" />}
            {action.title}
          </Button>
        )
      })}
    </div>
  )
}
