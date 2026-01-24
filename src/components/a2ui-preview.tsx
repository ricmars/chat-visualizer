"use client";

import styled from "styled-components";
import { useState, useMemo, useCallback } from "react";

// ============================================================================
// A2UI TYPES
// ============================================================================

interface A2UIElement {
  "@type": string;
  id?: string;
  content?: string | A2UIElement[];
  properties?: Record<string, unknown>;
  style?: Record<string, string>;
  name?: string;
  label?: string;
  parameters?: Record<string, unknown>;
}

interface A2UIDocument {
  "@context"?: string;
  "@type": string;
  version?: string;
  elements: A2UIElement[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ElementsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Text Elements
const TextBlockElement = styled.p<{ $variant?: string; $color?: string }>`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: ${(props) => {
    if (props.$variant === "user-message" || props.$color === "primary") return "#3f57e4";
    return "#374151";
  }};
  ${(props) => props.$variant === "user-message" && `
    background: #3f57e4;
    color: white;
    padding: 8px 16px;
    border-radius: 20px 5px 20px 20px;
    align-self: flex-end;
    max-width: 80%;
  `}
`;

const HeadingElement = styled.h2<{ $size?: string }>`
  margin: 0;
  font-weight: 600;
  color: #111827;
  font-size: ${(props) => {
    switch (props.$size) {
      case "xl": return "24px";
      case "lg": return "20px";
      case "md": return "18px";
      case "sm": return "16px";
      default: return "20px";
    }
  }};
`;

const CaptionElement = styled.p<{ $size?: string; $color?: string }>`
  margin: 0;
  font-size: ${(props) => props.$size === "sm" ? "12px" : "14px"};
  color: ${(props) => props.$color === "muted" ? "#6b7280" : "#374151"};
  text-align: center;
`;

// Card
const CardElement = styled.div<{ $variant?: string }>`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${(props) => props.$variant === "elevated" && `
    border-left: 4px solid #3f57e4;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  `}
`;

// Alert
const AlertElement = styled.div<{ $variant?: string }>`
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${(props) => {
    switch (props.$variant) {
      case "positive":
      case "success":
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-left: 4px solid #10b981;
        `;
      case "negative":
      case "error":
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
        `;
      case "warning":
        return `
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 4px solid #f59e0b;
        `;
      case "informational":
      case "info":
      default:
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-left: 4px solid #3b82f6;
        `;
    }
  }}
`;

// Property List
const PropertyListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const PropertyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PropertyLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PropertyValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;

// Progress Stepper
const StepperContainer = styled.div<{ $orientation?: string }>`
  display: flex;
  flex-direction: ${(props) => props.$orientation === "vertical" ? "column" : "row"};
  align-items: ${(props) => props.$orientation === "vertical" ? "flex-start" : "center"};
  gap: ${(props) => props.$orientation === "vertical" ? "16px" : "8px"};
  flex-wrap: wrap;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepCircle = styled.div<{ $completed?: boolean; $current?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: ${(props) => {
    if (props.$completed) return "#10b981";
    if (props.$current) return "#3f57e4";
    return "#e5e7eb";
  }};
  color: ${(props) => (props.$completed || props.$current) ? "white" : "#9ca3af"};
`;

const StepLabel = styled.span<{ $completed?: boolean; $current?: boolean }>`
  font-size: 13px;
  font-weight: ${(props) => props.$current ? "600" : "400"};
  color: ${(props) => {
    if (props.$completed) return "#10b981";
    if (props.$current) return "#3f57e4";
    return "#9ca3af";
  }};
`;

const StepConnector = styled.div<{ $orientation?: string }>`
  ${(props) => props.$orientation === "vertical" ? `
    width: 2px;
    height: 24px;
    margin-left: 13px;
  ` : `
    width: 32px;
    height: 2px;
  `}
  background: #e5e7eb;
`;

// Markdown
const MarkdownContainer = styled.div`
  font-size: 14px;
  line-height: 1.7;
  color: #374151;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 20px;
    margin-bottom: 12px;
    font-weight: 600;
    line-height: 1.25;
    color: #111827;
    &:first-child { margin-top: 0; }
  }

  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }

  p { margin: 0 0 12px; &:last-child { margin: 0; } }

  ul, ol {
    margin: 0 0 12px;
    padding-left: 24px;
  }

  li { margin: 4px 0; }

  strong { font-weight: 600; }

  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    font-family: monospace;
  }

  pre {
    background: #1e1e1e;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
  }

  pre code {
    background: none;
    padding: 0;
    color: #e5e7eb;
  }
`;

// Code Block
const CodeBlockContainer = styled.div`
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
`;

const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CodeBlockFilename = styled.span`
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
`;

const CodeBlockLanguage = styled.span`
  font-size: 11px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
`;

const CodeBlockContent = styled.pre`
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: "Fira Code", "Monaco", "Menlo", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e5e7eb;
`;

// Output Block
const OutputBlockElement = styled.div<{ $variant?: string }>`
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  background: ${(props) =>
    props.$variant === "error" ? "#fef2f2" : "#f0fdf4"};
  color: ${(props) =>
    props.$variant === "error" ? "#dc2626" : "#15803d"};
  border: 1px solid ${(props) =>
    props.$variant === "error" ? "#fecaca" : "#bbf7d0"};
`;

// Metric Set
const MetricSetContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 8px;
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetricLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetricValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

// Image
const ImageElement = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
`;

// Data Table
const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f9fafb;
  }
  &:hover {
    background: #f3f4f6;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
`;

// Action Group
const ActionGroupContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  
  ${(props) => props.$primary ? `
    background: #3f57e4;
    color: white;
    border: none;
    &:hover { background: #3348c7; }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover { background: #f3f4f6; }
  `}
`;

// Form Elements
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3f57e4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FormSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3f57e4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
`;

const FormTextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #3f57e4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const RatingContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const RatingStar = styled.button<{ $filled?: boolean }>`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${(props) => props.$filled ? "#fbbf24" : "#d1d5db"};
  transition: color 0.15s ease;
  
  &:hover {
    color: #fbbf24;
  }
`;

// Error
const ErrorContainer = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
`;

// Action Log
const ActionLogContainer = styled.div`
  margin-top: 24px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
`;

const ActionLogTitle = styled.strong`
  display: block;
  margin-bottom: 8px;
`;

const ActionLogEntry = styled.div`
  margin-top: 4px;
  color: #6b7280;
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Simple markdown parser
function parseMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let isOrderedList = false;
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      if (isOrderedList) {
        elements.push(
          <ol key={key++}>
            {currentList.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key++}>
            {currentList.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
      }
      currentList = [];
    }
  };

  const parseInline = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  };

  for (const line of lines) {
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={key++}>{line.slice(2)}</h1>);
    } else if (line.match(/^[-*]\s/)) {
      if (isOrderedList && currentList.length > 0) flushList();
      isOrderedList = false;
      currentList.push(line.slice(2));
    } else if (line.match(/^\d+\.\s/)) {
      if (!isOrderedList && currentList.length > 0) flushList();
      isOrderedList = true;
      currentList.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim()) {
      flushList();
      elements.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
      );
    }
  }

  flushList();
  return elements;
}

// ============================================================================
// COMPONENT RENDERERS
// ============================================================================

interface RenderProps {
  element: A2UIElement;
  onAction: (action: { name: string; parameters?: Record<string, unknown> }) => void;
  formState: Record<string, unknown>;
  setFormState: (state: Record<string, unknown>) => void;
}

function RenderElement({ element, onAction, formState, setFormState }: RenderProps): React.ReactNode {
  const type = element["@type"];
  const style = element.style || {};
  const props = element.properties || {};

  switch (type) {
    case "TextBlock":
      return (
        <TextBlockElement
          key={element.id}
          $variant={style.variant}
          $color={style.color}
        >
          {element.content as string}
        </TextBlockElement>
      );

    case "Heading":
      return (
        <HeadingElement key={element.id} $size={style.size}>
          {element.content as string}
        </HeadingElement>
      );

    case "Caption":
      return (
        <CaptionElement key={element.id} $size={style.size} $color={style.color}>
          {element.content as string}
        </CaptionElement>
      );

    case "Card":
      return (
        <CardElement key={element.id} $variant={style.variant}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </CardElement>
      );

    case "Alert":
      return (
        <AlertElement key={element.id} $variant={style.variant}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </AlertElement>
      );

    case "PropertyList":
      return (
        <PropertyListContainer key={element.id}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </PropertyListContainer>
      );

    case "Property":
      return (
        <PropertyItem key={element.id}>
          <PropertyLabel>{props.label as string}</PropertyLabel>
          <PropertyValue>{props.value as string}</PropertyValue>
        </PropertyItem>
      );

    case "ProgressStepper": {
      const steps = (props.steps as Array<{
        id: string;
        label: string;
        completed?: boolean;
        current?: boolean;
      }>) || [];
      const orientation = props.orientation as string;
      
      return (
        <StepperContainer key={element.id} $orientation={orientation}>
          {steps.map((step, i) => (
            <StepItem key={step.id}>
              {i > 0 && <StepConnector $orientation={orientation} />}
              <StepCircle $completed={step.completed} $current={step.current}>
                {step.completed ? "✓" : i + 1}
              </StepCircle>
              <StepLabel $completed={step.completed} $current={step.current}>
                {step.label}
              </StepLabel>
            </StepItem>
          ))}
        </StepperContainer>
      );
    }

    case "MarkdownBlock":
      return (
        <MarkdownContainer key={element.id}>
          {parseMarkdown(element.content as string)}
        </MarkdownContainer>
      );

    case "CodeBlock": {
      const language = props.language as string;
      const filename = props.filename as string;
      return (
        <CodeBlockContainer key={element.id}>
          {(filename || language) && (
            <CodeBlockHeader>
              {filename && <CodeBlockFilename>{filename}</CodeBlockFilename>}
              {language && <CodeBlockLanguage>{language}</CodeBlockLanguage>}
            </CodeBlockHeader>
          )}
          <CodeBlockContent>{element.content as string}</CodeBlockContent>
        </CodeBlockContainer>
      );
    }

    case "OutputBlock":
      return (
        <OutputBlockElement key={element.id} $variant={style.variant}>
          {element.content as string}
        </OutputBlockElement>
      );

    case "MetricSet":
      return (
        <MetricSetContainer key={element.id}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </MetricSetContainer>
      );

    case "Metric":
      return (
        <MetricItem key={element.id}>
          <MetricLabel>{props.label as string}</MetricLabel>
          <MetricValue>{props.value as string}</MetricValue>
        </MetricItem>
      );

    case "Image":
      return (
        <ImageElement
          key={element.id}
          src={props.src as string}
          alt={props.alt as string || ""}
        />
      );

    case "DataTable": {
      const columns = (props.columns as Array<{ key: string; label: string }>) || [];
      const rows = (props.rows as Array<Record<string, unknown>>) || [];
      
      return (
        <TableContainer key={element.id}>
          <Table>
            <TableHeader>
              <tr>
                {columns.map((col) => (
                  <TableHeaderCell key={col.key}>{col.label}</TableHeaderCell>
                ))}
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{String(row[col.key] ?? "")}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    case "ActionGroup":
      return (
        <ActionGroupContainer key={element.id}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </ActionGroupContainer>
      );

    case "Action":
      return (
        <ActionButton
          key={element.id}
          $primary={element.name === "submitForm" || style.variant === "primary"}
          onClick={() => onAction({
            name: element.name || "unknown",
            parameters: element.parameters,
          })}
        >
          {element.label}
        </ActionButton>
      );

    case "Form":
      return (
        <FormContainer key={element.id}>
          {Array.isArray(element.content) &&
            element.content.map((child, i) => (
              <RenderElement
                key={child.id || i}
                element={child}
                onAction={onAction}
                formState={formState}
                setFormState={setFormState}
              />
            ))}
        </FormContainer>
      );

    case "TextField":
      return (
        <FormField key={element.id}>
          <FormLabel>
            {props.label as string}
            {Boolean(props.required) && <span style={{ color: "#ef4444" }}> *</span>}
          </FormLabel>
          <FormInput
            type={(props.inputType as string) || "text"}
            placeholder={props.placeholder as string}
            value={(formState[element.id || ""] as string) || ""}
            onChange={(e) =>
              setFormState({ ...formState, [element.id || ""]: e.target.value })
            }
          />
        </FormField>
      );

    case "SelectField": {
      const options = (props.options as Array<{ value: string; label: string }>) || [];
      return (
        <FormField key={element.id}>
          <FormLabel>
            {props.label as string}
            {Boolean(props.required) && <span style={{ color: "#ef4444" }}> *</span>}
          </FormLabel>
          <FormSelect
            value={(formState[element.id || ""] as string) || ""}
            onChange={(e) =>
              setFormState({ ...formState, [element.id || ""]: e.target.value })
            }
          >
            <option value="">Select an option...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
        </FormField>
      );
    }

    case "TextArea":
      return (
        <FormField key={element.id}>
          <FormLabel>
            {props.label as string}
            {Boolean(props.required) && <span style={{ color: "#ef4444" }}> *</span>}
          </FormLabel>
          <FormTextArea
            placeholder={props.placeholder as string}
            rows={(props.rows as number) || 4}
            value={(formState[element.id || ""] as string) || ""}
            onChange={(e) =>
              setFormState({ ...formState, [element.id || ""]: e.target.value })
            }
          />
        </FormField>
      );

    case "RatingField": {
      const maxRating = (props.maxRating as number) || 5;
      const currentRating = (formState[element.id || ""] as number) || 0;
      return (
        <FormField key={element.id}>
          <FormLabel>
            {props.label as string}
            {Boolean(props.required) && <span style={{ color: "#ef4444" }}> *</span>}
          </FormLabel>
          <RatingContainer>
            {Array.from({ length: maxRating }, (_, i) => (
              <RatingStar
                key={i}
                $filled={i < currentRating}
                onClick={() =>
                  setFormState({ ...formState, [element.id || ""]: i + 1 })
                }
              >
                ★
              </RatingStar>
            ))}
          </RatingContainer>
        </FormField>
      );
    }

    default:
      return (
        <ErrorContainer key={element.id}>
          Unknown A2UI element type: {type}
        </ErrorContainer>
      );
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface A2UIPreviewProps {
  jsonString: string;
}

export function A2UIPreview({ jsonString }: A2UIPreviewProps) {
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  // Parse the A2UI document
  const document = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      // Handle both direct document and wrapped format
      if (parsed["@type"] === "Document" || parsed.elements) {
        return parsed as A2UIDocument;
      }
      // If wrapped in cards array
      if (parsed.cards && Array.isArray(parsed.cards)) {
        return parsed.cards[0] as A2UIDocument;
      }
      return null;
    } catch {
      return null;
    }
  }, [jsonString]);

  // Action handler
  const handleAction = useCallback(
    (action: { name: string; parameters?: Record<string, unknown> }) => {
      const logEntry = `Action: ${action.name}${
        action.parameters ? ` (${JSON.stringify(action.parameters)})` : ""
      }`;
      setActionLog((prev) => [...prev.slice(-4), logEntry]);
      console.log("A2UI action:", action, "Form state:", formState);
    },
    [formState]
  );

  if (!document) {
    return (
      <PreviewContainer>
        <ScrollContainer>
          <ErrorContainer>
            Invalid or empty A2UI document. Please check the JSON structure.
          </ErrorContainer>
        </ScrollContainer>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer>
      <ScrollContainer>
        <ElementsContainer>
          {document.elements.map((element, i) => (
            <RenderElement
              key={element.id || i}
              element={element}
              onAction={handleAction}
              formState={formState}
              setFormState={setFormState}
            />
          ))}
        </ElementsContainer>

        {actionLog.length > 0 && (
          <ActionLogContainer>
            <ActionLogTitle>Action Log:</ActionLogTitle>
            {actionLog.map((log, i) => (
              <ActionLogEntry key={i}>{log}</ActionLogEntry>
            ))}
          </ActionLogContainer>
        )}
      </ScrollContainer>
    </PreviewContainer>
  );
}
