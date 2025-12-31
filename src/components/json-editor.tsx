
import { useEffect, useState, useMemo } from "react"
import styled from "styled-components"
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
  currentSample?: string
  onSampleLoad?: (sampleName: string) => void
}

type ViewMode = "edit" | "view"

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 16px;
  gap: 12px;
`

const EditorTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`

const SampleSelect = styled.select`
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3F57E4;
  }

  &:focus {
    outline: none;
    border-color: #3F57E4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const Button = styled.button<{ active?: boolean; variant?: 'default' | 'outline' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.variant === 'outline' ? '#e5e7eb' : 'transparent'};
  background: ${props => props.active ? '#3F57E4' : props.variant === 'outline' ? '#fff' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#374151'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#3F57E4' : 'rgba(0, 0, 0, 0.05)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`

const StatusValid = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #10b981;
`

const StatusError = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }
`

const Popover = styled.div`
  position: relative;
`

const PopoverContent = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 384px;
  max-height: 384px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 50;
`

const Alert = styled.div<{ variant?: 'destructive' }>`
  display: flex;
  gap: 8px;
  padding: 8px;
  background: ${props => props.variant === 'destructive' ? '#fef2f2' : 'transparent'};
  border-radius: 4px;
  margin-bottom: 8px;
`

const AlertDescription = styled.div`
  font-size: 12px;
  color: ${props => props.color || '#374151'};
`

const EditorArea = styled.div`
  flex: 1;
  overflow: auto;
`

const TreeViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
`

const TreeViewEmpty = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`

const JsonValue = styled.div`
  display: flex;
  flex-direction: column;
`

const JsonToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  margin-left: -4px;
  border-radius: 4px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`

const JsonExpanded = styled.div`
  margin-left: 16px;
  margin-top: 4px;
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
`

const JsonItem = styled.div`
  display: flex;
  gap: 8px;
  padding: 2px 0;
`

const JsonKey = styled.span`
  color: #374151;
  font-weight: 500;
`

const JsonString = styled.span`
  color: #059669;
`

const JsonNumber = styled.span`
  color: #2563eb;
`

const JsonBoolean = styled.span`
  color: #9333ea;
`

const JsonMuted = styled.span`
  color: #6b7280;
`

const JsonIndex = styled.span`
  color: #6b7280;
`

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

export function JsonEditor({ value, onChange, schema, currentSample, onSampleLoad }: JsonEditorProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("edit")
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["root"]))
  const [showErrors, setShowErrors] = useState(false)

  const loadSample = async (sampleName: string) => {
    if (!sampleName) return
    
    try {
      const response = await fetch(`/${sampleName}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${sampleName}`)
      }
      const json = await response.json()
      const prettified = JSON.stringify(json, null, 2)
      onChange(prettified)
      if (onSampleLoad) {
        onSampleLoad(sampleName)
      }
    } catch (error) {
      console.error(`Error loading sample ${sampleName}:`, error)
    }
  }

  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sampleName = e.target.value
    if (sampleName && sampleName !== currentSample) {
      loadSample(sampleName)
    }
  }

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
          backgroundColor: "rgba(0, 0, 0, 0.03)",
          borderRight: "1px solid #e5e7eb",
        },
        ".cm-lineNumbers": {
          minWidth: "3ch",
        },
        ".cm-foldGutter": {
          width: "1.5rem",
        },
        ".cm-foldPlaceholder": {
          color: "#6b7280",
        },
      }),
    ],
    []
  )

  const renderJsonValue = (val: any, path: string, _key: string | number): React.ReactNode => {
    if (val === null) {
      return <JsonMuted>null</JsonMuted>
    }

    const type = Array.isArray(val) ? "array" : typeof val as "object" | "string" | "number" | "boolean"

    if (type === "object" || type === "array") {
      const isExpanded = expandedPaths.has(path)
      const isEmpty = Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0

      if (isEmpty) {
        return (
          <JsonMuted>
            {type === "array" ? "[]" : "{}"}
          </JsonMuted>
        )
      }

      return (
        <JsonValue>
          <JsonToggle onClick={() => togglePath(path)}>
            {isExpanded ? (
              <ChevronDown size={12} color="#6b7280" />
            ) : (
              <ChevronRight size={12} color="#6b7280" />
            )}
            <JsonMuted>
              {type === "array" ? `[${val.length}]` : `{${Object.keys(val).length}}`}
            </JsonMuted>
          </JsonToggle>
          {isExpanded && (
            <JsonExpanded>
              {Array.isArray(val) ? (
                val.map((item, index) => (
                  <JsonItem key={index}>
                    <JsonIndex>{index}:</JsonIndex>
                    {renderJsonValue(item, `${path}.${index}`, index)}
                  </JsonItem>
                ))
              ) : (
                Object.entries(val).map(([k, v]) => (
                  <JsonItem key={k}>
                    <JsonKey>"{k}":</JsonKey>
                    {renderJsonValue(v, `${path}.${k}`, k)}
                  </JsonItem>
                ))
              )}
            </JsonExpanded>
          )}
        </JsonValue>
      )
    }

    if (type === "string") {
      return <JsonString>"{String(val)}"</JsonString>
    }
    if (type === "number") {
      return <JsonNumber>{String(val)}</JsonNumber>
    }
    if (type === "boolean") {
      return <JsonBoolean>{String(val)}</JsonBoolean>
    }

    return <span>{String(val)}</span>
  }

  const renderTreeView = () => {
    try {
      const parsed = JSON.parse(value)
      return (
        <TreeViewContainer>
          {renderJsonValue(parsed, "root", "root")}
        </TreeViewContainer>
      )
    } catch {
      return (
        <TreeViewEmpty>
          Invalid JSON - switch to edit mode to fix
        </TreeViewEmpty>
      )
    }
  }

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>
          JSON Editor
          <SampleSelect value={currentSample || "sample1.json"} onChange={handleSampleChange}>
            <option value="sample1.json">Sample 1 - Data Analysis</option>
            <option value="sample2.json">Sample 2 - JavaScript Example</option>
            <option value="sample3.json">Sample 3 - Case Example</option>
          </SampleSelect>
        </EditorTitle>
        <HeaderActions>
          <ButtonGroup>
            <Button
              active={viewMode === "edit"}
              onClick={() => setViewMode("edit")}
            >
              <Edit2 size={12} />
              Edit
            </Button>
            <Button
              active={viewMode === "view"}
              onClick={() => setViewMode("view")}
            >
              <Eye size={12} />
              View
            </Button>
          </ButtonGroup>
          {viewMode === "edit" && (
            <Button
              variant="outline"
              onClick={handlePrettify}
            >
              <Code2 size={12} />
              Prettify
            </Button>
          )}
          {viewMode === "view" && (
            <ButtonGroup>
              <Button
                variant="outline"
                onClick={expandAll}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                onClick={collapseAll}
              >
                Collapse All
              </Button>
            </ButtonGroup>
          )}
          <StatusContainer>
            {isValid ? (
              <StatusValid>
                <CheckCircle2 size={14} />
                Valid
              </StatusValid>
            ) : (
              <Popover>
                <StatusError onClick={() => setShowErrors(!showErrors)}>
                  <AlertCircle size={14} />
                  {errors.length} Error{errors.length !== 1 ? "s" : ""}
                </StatusError>
                {showErrors && (
                  <PopoverContent>
                    <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>Validation Errors</div>
                    {errors.map((error, i) => (
                      <Alert key={i} variant="destructive">
                        <AlertCircle size={16} color="#ef4444" />
                        <AlertDescription color="#ef4444">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </PopoverContent>
                )}
              </Popover>
            )}
          </StatusContainer>
        </HeaderActions>
      </EditorHeader>

      {viewMode === "edit" ? (
        <EditorArea>
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme="light"
            basicSetup={false}
            editable={true}
            style={{ height: "100%", minHeight: "100%" }}
          />
        </EditorArea>
      ) : (
        renderTreeView()
      )}
    </EditorContainer>
  )
}
