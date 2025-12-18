"use client"

import type { InsightPart } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface InsightCardProps {
  part: InsightPart
}

export function InsightCard({ part }: InsightCardProps) {
  const { content } = part
  const severity = content.severity || "info"

  const severityConfig = {
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
    warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
    error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/5" },
    success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  }

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <Card className={cn("border-2", config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">{content.title}</CardTitle>
            <CardDescription className="text-sm">{content.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      {content.metrics && content.metrics.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {content.metrics.map((metric, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
