"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: any
}

export function JsonEditor({ value, onChange, schema }: JsonEditorProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    validateJson(value)
  }, [value])

  const validateJson = (jsonString: string) => {
    const newErrors: string[] = []

    // Check if valid JSON
    try {
      const parsed = JSON.parse(jsonString)

      // Basic schema validation
      if (schema) {
        if (parsed.type !== "ui_message") {
          newErrors.push('Message type must be "ui_message"')
        }
        if (!parsed.version) {
          newErrors.push("Version is required")
        }
        if (!parsed.parts || !Array.isArray(parsed.parts)) {
          newErrors.push("Parts array is required")
        }
      }
    } catch (e) {
      newErrors.push(`Invalid JSON: ${(e as Error).message}`)
    }

    setErrors(newErrors)
    setIsValid(newErrors.length === 0)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <h2 className="text-sm font-semibold">JSON Editor</h2>
        <div className="flex items-center gap-2 text-xs">
          {isValid ? (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Valid
            </div>
          ) : (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.length} Error{errors.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="border-b border-border bg-destructive/5 p-3">
          {errors.map((error, i) => (
            <Alert key={i} variant="destructive" className="mb-2 py-2 last:mb-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 flex-1 resize-none bg-background p-4 font-mono text-sm leading-relaxed outline-none"
        spellCheck={false}
        placeholder="Enter JSON here..."
      />
    </div>
  )
}
