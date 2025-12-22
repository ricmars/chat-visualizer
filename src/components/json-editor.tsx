"use client"

import { useEffect, useState, useMemo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, CheckCircle2, Code2, Eye, Edit2, ChevronRight, ChevronDown } from "lucide-react"
import Ajv from "ajv"
import addFormats from "ajv-formats"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { foldGutter, foldKeymap, bracketMatching } from "@codemirror/language"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { keymap, lineNumbers, highlightActiveLineGutter } from "@codemirror/view"
import { Extension } from "@codemirror/state"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: any
}

type ViewMode = "edit" | "view"

// Helper function to resolve $ref references in schema
function resolveSchemaRef(ref: string, rootSchema: any): any {
  if (!ref || !ref.startsWith("#/")) {
    return null
  }
  const path = ref.replace("#/", "").split("/")
  let current = rootSchema
  for (const segment of path) {
    current = current?.[segment]
    if (current === undefined) {
      return null
    }
  }
  return current
}

// Helper function to check if a schema property is an enum field
function isEnumField(propSchema: any, rootSchema: any): boolean {
  if (!propSchema) return false
  
  // Direct enum
  if (propSchema.enum) return true
  
  // Enum via $ref
  if (propSchema.$ref) {
    const resolved = resolveSchemaRef(propSchema.$ref, rootSchema)
    return resolved?.enum !== undefined
  }
  
  return false
}

// Helper function to remove empty string values from optional enum fields
function removeEmptyEnumValues(obj: any, schema: any, rootSchema: any, path: string = ""): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    // Resolve $ref if needed
    if (schema?.$ref) {
      schema = resolveSchemaRef(schema.$ref, rootSchema) || schema
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        const itemSchema = schema?.items
        if (itemSchema) {
          return removeEmptyEnumValues(item, itemSchema, rootSchema, `${path}[${index}]`)
        }
        return item
      })
    }

    // Handle objects
    if (typeof obj === "object") {
      const cleaned: any = {}
      
      // Get properties and required fields, handling anyOf/oneOf
      let allProps: Record<string, any> = {}
      let allRequired: string[] = []
      let matchingSchema: any = null
      
      if (schema?.anyOf || schema?.oneOf) {
        const schemas = schema.anyOf || schema.oneOf || []
        
        // Try to find matching schema based on 'type' field (for discriminated unions)
        if (obj.type && typeof obj.type === "string") {
          for (const subSchema of schemas) {
            const resolved = subSchema.$ref ? resolveSchemaRef(subSchema.$ref, rootSchema) : subSchema
            if (resolved?.properties?.type?.const === obj.type) {
              matchingSchema = resolved
              break
            }
          }
        }
        
        // Collect all properties from all schemas (for checking enums)
        schemas.forEach((subSchema: any) => {
          const resolved = subSchema.$ref ? resolveSchemaRef(subSchema.$ref, rootSchema) : subSchema
          if (resolved?.properties) {
            allProps = { ...allProps, ...resolved.properties }
          }
          if (resolved?.required) {
            allRequired = [...new Set([...allRequired, ...resolved.required])]
          }
        })
        
        // If we found a matching schema, use its required fields
        if (matchingSchema) {
          allRequired = matchingSchema.required || []
        }
      } else {
        const resolved = schema?.$ref ? resolveSchemaRef(schema.$ref, rootSchema) : schema
        allProps = resolved?.properties || {}
        allRequired = resolved?.required || []
        matchingSchema = resolved
      }

      for (const [key, val] of Object.entries(obj)) {
        let propSchema = allProps[key]
        
        // Resolve $ref for property schema
        if (propSchema?.$ref) {
          propSchema = resolveSchemaRef(propSchema.$ref, rootSchema) || propSchema
        }
        
        const isRequired = allRequired.includes(key)
        
        // If property is an empty string and not required, check if it's an enum field
        if (val === "" && !isRequired && propSchema) {
          if (isEnumField(allProps[key], rootSchema)) {
            // Skip empty string enum values - treat as undefined
            continue
          }
        }
        
        // Recursively clean nested objects
        if (typeof val === "object" && val !== null && propSchema) {
          cleaned[key] = removeEmptyEnumValues(val, propSchema, rootSchema, path ? `${path}.${key}` : key)
        } else {
          cleaned[key] = val
        }
      }
      
      return cleaned
    }

    return obj
}

export function JsonEditor({ value, onChange, schema }: JsonEditorProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("edit")
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["root"]))

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
    if (validator && schema) {
      // Preprocess: remove empty strings from optional enum fields
      const cleaned = removeEmptyEnumValues(parsed, schema, schema)
      
      const valid = validator(cleaned)
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
  }, [value, validator, schema])

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(value)
      const prettified = JSON.stringify(parsed, null, 2)
      onChange(prettified)
    } catch {
      // Invalid JSON, can't prettify
    }
  }

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const expandAll = () => {
    try {
      const parsed = JSON.parse(value)
      const allPaths = new Set<string>(["root"])
      const collectPaths = (obj: any, path: string) => {
        if (typeof obj === "object" && obj !== null) {
          allPaths.add(path)
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              collectPaths(item, `${path}.${index}`)
            })
          } else {
            Object.keys(obj).forEach((key) => {
              collectPaths(obj[key], `${path}.${key}`)
            })
          }
        }
      }
      collectPaths(parsed, "root")
      setExpandedPaths(allPaths)
    } catch {
      // Invalid JSON
    }
  }

  const collapseAll = () => {
    setExpandedPaths(new Set(["root"]))
  }

  // CodeMirror extensions
  const extensions: Extension[] = useMemo(
    () => [
      json(),
      lineNumbers(),
      foldGutter({
        openText: "▾",
        closedText: "▸",
      }),
      bracketMatching(),
      history(),
      highlightActiveLineGutter(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
      EditorView.theme({
        "&": {
          fontSize: "0.875rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          height: "100%",
        },
        ".cm-scroller": {
          overflow: "auto",
          height: "100%",
        },
        ".cm-content": {
          padding: "1rem",
          minHeight: "100%",
        },
        ".cm-gutters": {
          backgroundColor: "hsl(var(--muted) / 0.3)",
          borderRight: "1px solid hsl(var(--border))",
        },
        ".cm-lineNumbers": {
          minWidth: "3ch",
        },
        ".cm-foldGutter": {
          width: "1.5rem",
        },
        ".cm-foldPlaceholder": {
          color: "hsl(var(--muted-foreground))",
        },
      }),
    ],
    []
  )

  const renderJsonValue = (val: any, path: string, _key: string | number): React.ReactNode => {
    if (val === null) {
      return <span className="text-muted-foreground">null</span>
    }

    const type = Array.isArray(val) ? "array" : typeof val as "object" | "string" | "number" | "boolean"

    if (type === "object" || type === "array") {
      const isExpanded = expandedPaths.has(path)
      const isEmpty = Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0

      if (isEmpty) {
        return (
          <span className="text-muted-foreground">
            {type === "array" ? "[]" : "{}"}
          </span>
        )
      }

      return (
        <div className="flex flex-col">
          <button
            onClick={() => togglePath(path)}
            className="flex items-center gap-1 hover:bg-accent/50 rounded px-1 -ml-1 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {type === "array" ? `[${val.length}]` : `{${Object.keys(val).length}}`}
            </span>
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 border-l border-border pl-2">
              {Array.isArray(val) ? (
                val.map((item, index) => (
                  <div key={index} className="flex gap-2 py-0.5">
                    <span className="text-muted-foreground">{index}:</span>
                    {renderJsonValue(item, `${path}.${index}`, index)}
                  </div>
                ))
              ) : (
                Object.entries(val).map(([k, v]) => (
                  <div key={k} className="flex gap-2 py-0.5">
                    <span className="text-foreground font-medium">"{k}":</span>
                    {renderJsonValue(v, `${path}.${k}`, k)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )
    }

    if (type === "string") {
      return <span className="text-green-600 dark:text-green-400">"{String(val)}"</span>
    }
    if (type === "number") {
      return <span className="text-blue-600 dark:text-blue-400">{String(val)}</span>
    }
    if (type === "boolean") {
      return <span className="text-purple-600 dark:text-purple-400">{String(val)}</span>
    }

    return <span>{String(val)}</span>
  }

  const renderTreeView = () => {
    try {
      const parsed = JSON.parse(value)
      return (
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {renderJsonValue(parsed, "root", "root")}
        </div>
      )
    } catch {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Invalid JSON - switch to edit mode to fix
        </div>
      )
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <h2 className="text-sm font-semibold">JSON Editor</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("edit")}
              className="h-7 px-2 text-xs"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant={viewMode === "view" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("view")}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          </div>
          {viewMode === "edit" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrettify}
              className="h-7 px-2 text-xs"
            >
              <Code2 className="h-3 w-3" />
              Prettify
            </Button>
          )}
          {viewMode === "view" && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="h-7 px-2 text-xs"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="h-7 px-2 text-xs"
              >
                Collapse All
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            {isValid ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-destructive hover:opacity-80 cursor-pointer"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.length} Error{errors.length !== 1 ? "s" : ""}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-96 max-h-96 overflow-auto" align="end">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm mb-3">Validation Errors</h4>
                    {errors.map((error, i) => (
                      <Alert key={i} variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {viewMode === "edit" ? (
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme="light"
            basicSetup={false}
            editable={true}
            style={{ height: "100%", minHeight: "100%" }}
          />
        </div>
      ) : (
        renderTreeView()
      )}
    </div>
  )
}
