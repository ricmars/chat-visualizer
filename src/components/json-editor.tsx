"use client"

import { useEffect, useState, useMemo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import Ajv from "ajv"
import addFormats from "ajv-formats"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: any
}

export function JsonEditor({ value, onChange, schema }: JsonEditorProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)

  // Create and compile the validator once when schema changes
  const validator = useMemo(() => {
    if (!schema) return null
    
    const ajv = new Ajv({ allErrors: true, verbose: true })
    addFormats(ajv)
    return ajv.compile(schema)
  }, [schema])

  useEffect(() => {
    const newErrors: string[] = []

    // Check if valid JSON
    let parsed: any
    try {
      parsed = JSON.parse(value)
    } catch (e) {
      newErrors.push(`Invalid JSON: ${(e as Error).message}`)
      setErrors(newErrors)
      setIsValid(false)
      return
    }

    // Validate against schema using ajv
    if (validator) {
      const valid = validator(parsed)
      if (!valid && validator.errors) {
        // Format ajv errors into user-friendly messages
        validator.errors.forEach((error) => {
          const path = error.instancePath || error.schemaPath || ""
          const message = error.message || "Validation error"
          
          // Format the error message
          let errorMessage = message
          if (path) {
            // Remove leading slash and format path
            const cleanPath = path.replace(/^\//, "").replace(/\//g, ".")
            if (cleanPath) {
              errorMessage = `${cleanPath}: ${message}`
            }
          }
          
          // Add additional context for certain error types
          if (error.keyword === "required") {
            const missingProperty = error.params?.missingProperty
            if (missingProperty) {
              errorMessage = `${path || "root"}: Missing required property "${missingProperty}"`
            }
          } else if (error.keyword === "const") {
            errorMessage = `${path || "root"}: Must be "${error.params?.allowedValue}"`
          }
          
          newErrors.push(errorMessage)
        })
      }
    }

    setErrors(newErrors)
    setIsValid(newErrors.length === 0)
  }, [value, validator])

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
