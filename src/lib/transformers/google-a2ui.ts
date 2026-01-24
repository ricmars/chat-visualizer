// Google A2UI Transformer
// Transforms Pega ChatMessage to Google A2UI format
// A2UI is Google's AI-to-UI schema for generative AI interfaces

import type { 
  ChatMessage, 
  MessagePart, 
  TextPart, 
  MarkdownPart, 
  CodePart, 
  ImagePart, 
  InsightPart, 
  ViewPart,
  Case,
  Action
} from "../types";
import type { PlatformTransformer, TransformResult } from "./types";

/**
 * Google A2UI Element types
 * Based on Google's A2UI schema for AI-generated interfaces
 */
export interface A2UIElement {
  "@type": string;
  id?: string;
  content?: string | A2UIElement[];
  properties?: Record<string, unknown>;
  actions?: A2UIAction[];
  style?: A2UIStyle;
}

export interface A2UIAction {
  "@type": "Action";
  name: string;
  label: string;
  parameters?: Record<string, unknown>;
  confirmation?: {
    title: string;
    message: string;
  };
}

export interface A2UIStyle {
  variant?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  spacing?: string;
}

export interface A2UIDocument {
  "@context": "https://schema.google.com/a2ui";
  "@type": "Document";
  version: string;
  elements: A2UIElement[];
  metadata?: {
    timestamp?: string;
    source?: string;
  };
}

/**
 * Transforms Pega ChatMessage to Google A2UI format
 */
export class GoogleA2UITransformer implements PlatformTransformer<A2UIDocument> {
  readonly platform = "google-a2ui" as const;
  readonly name = "Google A2UI";

  transform(message: ChatMessage): TransformResult<A2UIDocument> {
    const warnings: string[] = [];
    
    const elements: A2UIElement[] = [];

    // Add case header if present
    if (message.case) {
      elements.push(this.transformCase(message.case));
    }

    // Transform each part
    for (const part of message.parts) {
      const partElements = this.transformPart(part, message, warnings);
      elements.push(...partElements);
    }

    const doc: A2UIDocument = {
      "@context": "https://schema.google.com/a2ui",
      "@type": "Document",
      version: "1.0",
      elements,
      metadata: {
        timestamp: message.timestamp,
        source: "pega-chat-transform",
      },
    };

    return {
      platform: this.platform,
      output: doc,
      source: message,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private transformPart(
    part: MessagePart, 
    message: ChatMessage,
    warnings: string[]
  ): A2UIElement[] {
    switch (part.type) {
      case "text":
        return this.transformText(part);
      case "markdown":
        return this.transformMarkdown(part);
      case "code":
        return this.transformCode(part);
      case "image":
        return this.transformImage(part);
      case "insight":
        return this.transformInsight(part);
      case "view":
        return this.transformView(part, warnings);
      case "case":
        return message.case ? [this.transformCaseProgress(message.case)] : [];
      case "richText":
        warnings.push("RichText converted to formatted text in A2UI");
        return [{
          "@type": "FormattedText",
          id: (part as { id: string }).id,
          content: (part as { content: string }).content,
        }];
      default:
        warnings.push(`Unknown part type: ${(part as MessagePart).type}`);
        return [];
    }
  }

  private transformText(part: TextPart): A2UIElement[] {
    const isUser = part.role === "user";
    return [{
      "@type": "TextBlock",
      id: part.id,
      content: part.content,
      properties: {
        role: part.role,
      },
      style: {
        variant: isUser ? "user-message" : "assistant-message",
        color: isUser ? "primary" : "neutral",
      },
    }];
  }

  private transformMarkdown(part: MarkdownPart): A2UIElement[] {
    return [{
      "@type": "MarkdownBlock",
      id: part.id,
      content: part.content,
      properties: {
        allowHtml: false,
        sanitize: true,
      },
    }];
  }

  private transformCode(part: CodePart): A2UIElement[] {
    const elements: A2UIElement[] = [];

    elements.push({
      "@type": "CodeBlock",
      id: part.id,
      content: part.content,
      properties: {
        language: part.language || "plaintext",
        filename: part.filename,
        lineNumbers: true,
        copyable: true,
      },
    });

    // Add output if present
    if (part.output) {
      elements.push({
        "@type": "OutputBlock",
        id: `${part.id}-output`,
        content: String(part.output.data),
        style: {
          variant: part.output.type === "error" ? "error" : "success",
        },
      });
    }

    // Add status indicator if present
    if (part.status && part.status !== "idle") {
      elements.push({
        "@type": "StatusIndicator",
        id: `${part.id}-status`,
        properties: {
          status: part.status,
        },
      });
    }

    return elements;
  }

  private transformImage(part: ImagePart): A2UIElement[] {
    const elements: A2UIElement[] = [];

    elements.push({
      "@type": "Image",
      id: part.id,
      properties: {
        src: part.url,
        alt: part.altText || "",
        responsive: true,
      },
    });

    if (part.caption) {
      elements.push({
        "@type": "Caption",
        id: `${part.id}-caption`,
        content: part.caption,
        style: {
          size: "sm",
          color: "muted",
        },
      });
    }

    return elements;
  }

  private transformInsight(part: InsightPart): A2UIElement[] {
    const severityMap = {
      info: "informational",
      success: "positive",
      warning: "cautionary",
      error: "critical",
    };

    const children: A2UIElement[] = [
      {
        "@type": "Heading",
        content: part.content.title,
        style: { size: "lg" },
      },
      {
        "@type": "TextBlock",
        content: part.content.description,
      },
    ];

    // Add metrics if present
    if (part.content.metrics && part.content.metrics.length > 0) {
      children.push({
        "@type": "MetricSet",
        content: part.content.metrics.map((m) => ({
          "@type": "Metric",
          properties: {
            label: m.label,
            value: m.value,
            unit: m.unit,
            trend: m.trend,
          },
        })) as unknown as string,
      });
    }

    return [{
      "@type": "Alert",
      id: part.id,
      content: children,
      style: {
        variant: severityMap[part.content.severity || "info"],
      },
    }];
  }

  private transformView(part: ViewPart, warnings: string[]): A2UIElement[] {
    switch (part.content.viewType) {
      case "table":
        return [this.transformTable(part)];
      case "list":
        return [this.transformList(part)];
      case "chart":
        return [this.transformChart(part)];
      default:
        warnings.push(`View type '${part.content.viewType}' not fully supported in A2UI`);
        return [{
          "@type": "DataView",
          id: part.id,
          properties: {
            viewType: part.content.viewType,
            data: part.content.data,
          },
        }];
    }
  }

  private transformTable(part: ViewPart): A2UIElement {
    const data = part.content.data as Record<string, unknown>[];
    const columns = part.content.config?.columns as string[] || 
                   (data.length > 0 ? Object.keys(data[0]) : []);

    return {
      "@type": "DataTable",
      id: part.id,
      properties: {
        columns: columns.map((col) => ({
          key: col,
          label: col,
          sortable: true,
        })),
        rows: data,
        pagination: data.length > 10,
        searchable: true,
      },
    };
  }

  private transformList(part: ViewPart): A2UIElement {
    const data = part.content.data as unknown[];
    
    return {
      "@type": "List",
      id: part.id,
      content: data.map((item, index) => ({
        "@type": "ListItem",
        id: `${part.id}-item-${index}`,
        content: typeof item === "object" ? JSON.stringify(item) : String(item),
      })) as unknown as string,
      properties: {
        ordered: false,
      },
    };
  }

  private transformChart(part: ViewPart): A2UIElement {
    return {
      "@type": "Chart",
      id: part.id,
      properties: {
        type: part.content.config?.chartType || "bar",
        data: part.content.data,
        options: part.content.config,
      },
    };
  }

  private transformCase(caseData: Case): A2UIElement {
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);
    const currentStageName = currentStageIndex >= 0 
      ? caseData.stages[currentStageIndex].name 
      : caseData.status;

    return {
      "@type": "Card",
      id: `case-${caseData.id}`,
      content: [
        {
          "@type": "Heading",
          content: caseData.name,
          style: { size: "xl" },
        },
        {
          "@type": "PropertyList",
          content: [
            { "@type": "Property", properties: { label: "Case ID", value: caseData.id } },
            { "@type": "Property", properties: { label: "Current Stage", value: currentStageName } },
            { "@type": "Property", properties: { label: "Progress", value: `${currentStageIndex + 1} of ${caseData.stages.length}` } },
          ] as unknown as string,
        },
      ],
      style: {
        variant: "elevated",
      },
    };
  }

  private transformCaseProgress(caseData: Case): A2UIElement {
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);

    return {
      "@type": "ProgressStepper",
      id: `case-progress-${caseData.id}`,
      properties: {
        steps: caseData.stages.map((stage, index) => ({
          id: stage.id,
          label: stage.name,
          completed: index < currentStageIndex,
          current: index === currentStageIndex,
        })),
        orientation: "horizontal",
      },
    };
  }

  private transformActions(actions: Action[]): A2UIAction[] {
    return actions.map((action) => ({
      "@type": "Action" as const,
      name: action.verb,
      label: action.title,
      parameters: {
        actionId: action.id,
        ...action.payload,
      },
    }));
  }

  supports(feature: string): boolean {
    const supportedFeatures = [
      "text", "markdown", "code", "image", "insight", 
      "view:table", "view:list", "view:chart", "case", "actions"
    ];
    return supportedFeatures.includes(feature);
  }
}
