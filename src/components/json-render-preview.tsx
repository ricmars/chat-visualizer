"use client";

import styled from "styled-components";
import { useState, useMemo, useCallback } from "react";
import type { JsonRenderTree, JsonRenderElement } from "@/lib/transformers/json-render";

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
`;

const Header = styled.div`
  border-bottom: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 16px;
`;

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ContainerElement = styled.div<{ $direction?: string; $gap?: string }>`
  display: flex;
  flex-direction: ${(props) => (props.$direction === "row" ? "row" : "column")};
  gap: ${(props) => {
    switch (props.$gap) {
      case "xs": return "4px";
      case "sm": return "8px";
      case "md": return "16px";
      case "lg": return "24px";
      case "xl": return "32px";
      default: return "16px";
    }
  }};
  flex-wrap: wrap;
`;

const CardElement = styled.div<{ $variant?: string }>`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: ${(props) => {
    switch (props.$variant) {
      case "success": return "4px solid #10b981";
      case "warning": return "4px solid #f59e0b";
      case "error": return "4px solid #ef4444";
      case "info": return "4px solid #3b82f6";
      case "elevated": return "4px solid #3f57e4";
      default: return "none";
    }
  }};
`;

const TextElement = styled.p<{ $variant?: string }>`
  margin: 0;
  font-size: ${(props) => {
    switch (props.$variant) {
      case "heading": return "20px";
      case "subheading": return "16px";
      case "caption": return "12px";
      case "label": return "12px";
      default: return "14px";
    }
  }};
  font-weight: ${(props) => {
    switch (props.$variant) {
      case "heading": return "700";
      case "subheading": return "600";
      default: return "400";
    }
  }};
  color: ${(props) => {
    switch (props.$variant) {
      case "user": return "#3f57e4";
      case "caption": return "#6b7280";
      case "label": return "#6b7280";
      default: return "#374151";
    }
  }};
  line-height: 1.6;
`;

const MetricGridContainer = styled.div`
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

const MetricValue = styled.span<{ $trend?: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => {
    if (props.$trend === "up") return "#10b981";
    if (props.$trend === "down") return "#ef4444";
    return "#111827";
  }};
`;

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

const OutputElement = styled.div<{ $variant?: string }>`
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

const StatusBadge = styled.span<{ $status?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: ${(props) => {
    switch (props.$status) {
      case "running": return "#dbeafe";
      case "completed": return "#dcfce7";
      case "error": return "#fee2e2";
      default: return "#f3f4f6";
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case "running": return "#1d4ed8";
      case "completed": return "#15803d";
      case "error": return "#dc2626";
      default: return "#6b7280";
    }
  }};

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const ImageElement = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
`;

const MarkdownContainer = styled.div`
  font-size: 14px;
  line-height: 1.7;
  color: #374151;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: #111827;
  }

  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }

  p { margin: 0 0 16px; }

  ul, ol {
    margin: 0 0 16px;
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
    margin: 16px 0;
  }

  pre code {
    background: none;
    padding: 0;
    color: #e5e7eb;
  }

  blockquote {
    margin: 16px 0;
    padding-left: 16px;
    border-left: 4px solid #e5e7eb;
    color: #6b7280;
  }
`;

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

const TableRow = styled.tr<{ $striped?: boolean; $hoverable?: boolean }>`
  background: ${(props) => (props.$striped ? "#f9fafb" : "white")};
  transition: background 0.15s ease;

  ${(props) =>
    props.$hoverable &&
    `
    &:hover {
      background: #f3f4f6;
    }
  `}
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
`;

const ChartContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h4`
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const ChartPlaceholder = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 13px;
  flex-direction: column;
  gap: 8px;
`;

const ButtonElement = styled.button<{ $variant?: string; $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: #3f57e4;
          color: white;
          border: none;
          &:hover:not(:disabled) { background: #3348c7; }
        `;
      case "destructive":
      case "danger":
        return `
          background: #ef4444;
          color: white;
          border: none;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      default:
        return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #f3f4f6; }
        `;
    }
  }}
`;

const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepCircle = styled.div<{ $status?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$status) {
      case "completed": return "#10b981";
      case "current": return "#3f57e4";
      default: return "#e5e7eb";
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case "completed":
      case "current":
        return "white";
      default:
        return "#9ca3af";
    }
  }};
`;

const StepLabel = styled.span<{ $status?: string }>`
  font-size: 13px;
  font-weight: ${(props) => (props.$status === "current" ? "600" : "400")};
  color: ${(props) => {
    switch (props.$status) {
      case "completed": return "#10b981";
      case "current": return "#3f57e4";
      default: return "#9ca3af";
    }
  }};
`;

const StepConnector = styled.div`
  width: 40px;
  height: 2px;
  background: #e5e7eb;
`;

const ListContainer = styled.ul<{ $variant?: string }>`
  margin: 0;
  padding-left: ${(props) => (props.$variant === "ordered" ? "24px" : "20px")};
  list-style-type: ${(props) =>
    props.$variant === "ordered" ? "decimal" : "disc"};
`;

const ListItem = styled.li`
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
`;

const DataViewContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const DataViewTitle = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ErrorContainer = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
`;

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
// COMPONENT REGISTRY
// ============================================================================

interface ElementProps {
  element: JsonRenderElement;
  children?: React.ReactNode;
  onAction: (action: { name: string; params?: Record<string, unknown> }) => void;
}

// Simple markdown parser (basic implementation)
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
    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={key++}>{line.slice(2)}</h1>);
    }
    // Unordered list
    else if (line.match(/^[-*]\s/)) {
      if (isOrderedList && currentList.length > 0) {
        flushList();
      }
      isOrderedList = false;
      currentList.push(line.slice(2));
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      if (!isOrderedList && currentList.length > 0) {
        flushList();
      }
      isOrderedList = true;
      currentList.push(line.replace(/^\d+\.\s/, ""));
    }
    // Regular paragraph
    else if (line.trim()) {
      flushList();
      elements.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
      );
    }
  }

  flushList();
  return elements;
}

// Component renderers
const componentRegistry: Record<string, React.FC<ElementProps>> = {
  // Layout Components
  Container: ({ element, children }) => (
    <ContainerElement
      $direction={element.props.direction as string}
      $gap={element.props.gap as string}
      className={element.props.className as string}
    >
      {children}
    </ContainerElement>
  ),

  Card: ({ element, children }) => (
    <CardElement
      $variant={element.props.variant as string}
      className={element.props.className as string}
    >
      {children}
    </CardElement>
  ),

  // Text Components
  Text: ({ element }) => (
    <TextElement
      $variant={element.props.variant as string}
      className={element.props.className as string}
    >
      {element.props.content as string}
    </TextElement>
  ),

  Markdown: ({ element }) => (
    <MarkdownContainer>
      {parseMarkdown(element.props.content as string)}
    </MarkdownContainer>
  ),

  // Data Components
  Metric: ({ element }) => {
    const { label, value, trend, unit } = element.props as {
      label: string;
      value: string | number;
      trend?: string;
      unit?: string;
    };
    return (
      <MetricItem>
        <MetricLabel>{label}</MetricLabel>
        <MetricValue $trend={trend}>
          {value}{unit && ` ${unit}`}
        </MetricValue>
      </MetricItem>
    );
  },

  MetricGrid: ({ element }) => {
    const metrics = element.props.metrics as Array<{
      label: string;
      value: string | number;
      unit?: string;
      trend?: string;
    }>;
    return (
      <MetricGridContainer>
        {metrics.map((metric, i) => (
          <MetricItem key={i}>
            <MetricLabel>{metric.label}</MetricLabel>
            <MetricValue $trend={metric.trend}>
              {metric.value}{metric.unit && ` ${metric.unit}`}
            </MetricValue>
          </MetricItem>
        ))}
      </MetricGridContainer>
    );
  },

  Table: ({ element }) => {
    const { columns, data, striped, hoverable } = element.props as {
      columns: Array<{ key: string; header: string }>;
      data: Array<Record<string, unknown>>;
      striped?: boolean;
      hoverable?: boolean;
    };
    return (
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              {columns.map((col) => (
                <TableHeaderCell key={col.key}>{col.header}</TableHeaderCell>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} $striped={striped && i % 2 === 1} $hoverable={hoverable}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{String(row[col.key] ?? "")}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },

  List: ({ element }) => {
    const { items, variant } = element.props as {
      items: Array<{ content: string }>;
      variant?: string;
    };
    return (
      <ListContainer $variant={variant}>
        {items.map((item, i) => (
          <ListItem key={i}>{item.content}</ListItem>
        ))}
      </ListContainer>
    );
  },

  Chart: ({ element }) => {
    const { chartType, config, data } = element.props as {
      chartType?: string;
      config?: { title?: string };
      data?: { labels?: string[]; datasets?: Array<{ label: string; data: number[] }> };
    };
    return (
      <ChartContainer>
        {config?.title && <ChartTitle>{config.title}</ChartTitle>}
        <ChartPlaceholder>
          <span style={{ fontSize: 32 }}>📊</span>
          <span>{chartType || "bar"} chart visualization</span>
          {data?.datasets && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {data.datasets.map(ds => ds.label).join(", ")}
            </span>
          )}
        </ChartPlaceholder>
      </ChartContainer>
    );
  },

  DataView: ({ element }) => {
    const { viewType, data } = element.props;
    return (
      <DataViewContainer>
        <DataViewTitle>Data View: {viewType as string}</DataViewTitle>
        <pre style={{ margin: 0, fontSize: 12, overflow: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </DataViewContainer>
    );
  },

  // Code Components
  CodeBlock: ({ element }) => {
    const { code, language, filename } = element.props as {
      code: string;
      language?: string;
      filename?: string;
    };
    return (
      <CodeBlockContainer>
        {(filename || language) && (
          <CodeBlockHeader>
            {filename && <CodeBlockFilename>{filename}</CodeBlockFilename>}
            {language && <CodeBlockLanguage>{language}</CodeBlockLanguage>}
          </CodeBlockHeader>
        )}
        <CodeBlockContent>{code}</CodeBlockContent>
      </CodeBlockContainer>
    );
  },

  Output: ({ element }) => (
    <OutputElement $variant={element.props.variant as string}>
      {element.props.content as string}
    </OutputElement>
  ),

  Status: ({ element }) => (
    <StatusBadge $status={element.props.status as string}>
      {element.props.label as string || element.props.status as string}
    </StatusBadge>
  ),

  // Media Components
  Image: ({ element }) => (
    <ImageElement
      src={element.props.src as string}
      alt={element.props.alt as string || ""}
      className={element.props.className as string}
    />
  ),

  // Interactive Components
  Button: ({ element, onAction }) => {
    const { label, variant, disabled } = element.props as {
      label: string;
      variant?: string;
      disabled?: boolean;
    };
    const action = element.actions;
    return (
      <ButtonElement
        $variant={variant}
        $disabled={disabled}
        disabled={disabled}
        onClick={() => action && onAction({ name: action.name, params: action.params as Record<string, unknown> })}
      >
        {label}
      </ButtonElement>
    );
  },

  // Progress Components
  Stepper: ({ element }) => {
    const { steps } = element.props as {
      steps: Array<{ id: string; label: string; status: string }>;
    };
    return (
      <StepperContainer>
        {steps.map((step, i) => (
          <StepItem key={step.id}>
            {i > 0 && <StepConnector />}
            <StepCircle $status={step.status}>
              {step.status === "completed" ? "✓" : i + 1}
            </StepCircle>
            <StepLabel $status={step.status}>{step.label}</StepLabel>
          </StepItem>
        ))}
      </StepperContainer>
    );
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface JsonRenderPreviewProps {
  jsonString: string;
}

export function JsonRenderPreview({ jsonString }: JsonRenderPreviewProps) {
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Parse the JSON tree
  const tree = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      // Handle both direct tree format and wrapped format
      if (parsed.root) {
        return parsed as JsonRenderTree;
      }
      // If it's wrapped in a "cards" array (from transformer output)
      if (parsed.cards && Array.isArray(parsed.cards)) {
        return parsed.cards[0] as JsonRenderTree;
      }
      return null;
    } catch {
      return null;
    }
  }, [jsonString]);

  // Action handler
  const handleAction = useCallback((action: { name: string; params?: Record<string, unknown> }) => {
    const logEntry = `Action: ${action.name}${action.params ? ` (${JSON.stringify(action.params)})` : ""}`;
    setActionLog((prev) => [...prev.slice(-4), logEntry]);
    console.log("json-render action:", action);
  }, []);

  // Recursive renderer for elements
  const renderElement = useCallback((element: JsonRenderElement, index: number): React.ReactNode => {
    const Component = componentRegistry[element.type];
    
    if (!Component) {
      return (
        <ErrorContainer key={index}>
          Unknown component type: {element.type}
        </ErrorContainer>
      );
    }

    const children = element.children?.map((child, i) => 
      renderElement(child, i)
    );

    return (
      <Component
        key={index}
        element={element}
        onAction={handleAction}
      >
        {children}
      </Component>
    );
  }, [handleAction]);

  if (!tree) {
    return (
      <PreviewContainer>
        <Header>
          <Title>Json-render Preview</Title>
        </Header>
        <ScrollContainer>
          <ErrorContainer>
            Invalid or empty json-render tree. Please check the JSON structure.
          </ErrorContainer>
        </ScrollContainer>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer>
      <Header>
        <Title>Json-render Preview</Title>
      </Header>
      <ScrollContainer>
        {renderElement(tree.root, 0)}
        
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
