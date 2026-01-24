// Vercel json-render Transformer
// Transforms Pega ChatMessage to json-render format
// See: https://json-render.dev/docs

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
 * json-render Element types
 * Based on json-render's catalog-based component system
 */
export interface JsonRenderElement {
  type: string;
  props: Record<string, unknown>;
  children?: JsonRenderElement[];
  visible?: JsonRenderVisibility;
  actions?: JsonRenderAction;
}

export interface JsonRenderVisibility {
  and?: JsonRenderVisibility[];
  or?: JsonRenderVisibility[];
  not?: JsonRenderVisibility;
  path?: string;
  auth?: "signedIn" | "signedOut";
}

export interface JsonRenderAction {
  name: string;
  params?: Record<string, unknown>;
  confirm?: {
    title: string;
    message: string;
    variant?: "default" | "danger" | "warning";
  };
}

export interface JsonRenderTree {
  $schema?: string;
  version: string;
  root: JsonRenderElement;
}

/**
 * Transforms Pega ChatMessage to Vercel json-render format
 */
export class JsonRenderTransformer implements PlatformTransformer<JsonRenderTree> {
  readonly platform = "json-render" as const;
  readonly name = "Json-render (Vercel)";

  transform(message: ChatMessage): TransformResult<JsonRenderTree> {
    const warnings: string[] = [];
    
    const children: JsonRenderElement[] = [];

    // Add case header if present
    if (message.case) {
      children.push(this.transformCase(message.case));
    }

    // Transform each part
    for (const part of message.parts) {
      const elements = this.transformPart(part, message, warnings);
      children.push(...elements);
    }

    const tree: JsonRenderTree = {
      $schema: "https://json-render.dev/schemas/tree.json",
      version: "1.0",
      root: {
        type: "Container",
        props: {
          direction: "column",
          gap: "md",
        },
        children,
      },
    };

    return {
      platform: this.platform,
      output: tree,
      source: message,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private transformPart(
    part: MessagePart, 
    message: ChatMessage,
    warnings: string[]
  ): JsonRenderElement[] {
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
        // Case is handled at message level, but we show status here
        return message.case ? [this.transformCaseStatus(message.case)] : [];
      case "richText":
        warnings.push("RichText converted to markdown in json-render");
        return [{
          type: "Markdown",
          props: {
            content: (part as { content: string }).content,
          },
        }];
      default:
        warnings.push(`Unknown part type: ${(part as MessagePart).type}`);
        return [];
    }
  }

  private transformText(part: TextPart): JsonRenderElement[] {
    const isUser = part.role === "user";
    return [{
      type: "Text",
      props: {
        content: part.content,
        variant: isUser ? "user" : "assistant",
        className: isUser ? "text-blue-600" : "text-gray-800",
      },
    }];
  }

  private transformMarkdown(part: MarkdownPart): JsonRenderElement[] {
    return [{
      type: "Markdown",
      props: {
        content: part.content,
      },
    }];
  }

  private transformCode(part: CodePart): JsonRenderElement[] {
    const elements: JsonRenderElement[] = [];

    // Create code container
    const codeElement: JsonRenderElement = {
      type: "CodeBlock",
      props: {
        code: part.content,
        language: part.language || "plaintext",
        filename: part.filename,
        showLineNumbers: true,
      },
    };

    elements.push(codeElement);

    // Add output if present
    if (part.output) {
      elements.push({
        type: "Output",
        props: {
          content: String(part.output.data),
          variant: part.output.type === "error" ? "error" : "success",
        },
      });
    }

    // Add status indicator if present
    if (part.status && part.status !== "idle") {
      elements.push({
        type: "Status",
        props: {
          status: part.status,
          label: `Status: ${part.status}`,
        },
      });
    }

    return elements;
  }

  private transformImage(part: ImagePart): JsonRenderElement[] {
    const elements: JsonRenderElement[] = [];

    elements.push({
      type: "Image",
      props: {
        src: part.url,
        alt: part.altText || "",
        className: "max-w-full rounded-lg",
      },
    });

    if (part.caption) {
      elements.push({
        type: "Text",
        props: {
          content: part.caption,
          variant: "caption",
          className: "text-center text-gray-500 text-sm",
        },
      });
    }

    return elements;
  }

  private transformInsight(part: InsightPart): JsonRenderElement[] {
    const severityVariant = {
      info: "info",
      success: "success",
      warning: "warning",
      error: "error",
    }[part.content.severity || "info"];

    const children: JsonRenderElement[] = [
      {
        type: "Text",
        props: {
          content: part.content.title,
          variant: "heading",
          className: "font-bold text-lg",
        },
      },
      {
        type: "Text",
        props: {
          content: part.content.description,
        },
      },
    ];

    // Add metrics if present
    if (part.content.metrics && part.content.metrics.length > 0) {
      children.push({
        type: "MetricGrid",
        props: {
          metrics: part.content.metrics.map((m) => ({
            label: m.label,
            value: m.value,
            unit: m.unit,
            trend: m.trend,
          })),
        },
      });
    }

    return [{
      type: "Card",
      props: {
        variant: severityVariant,
        className: `border-l-4 border-${severityVariant}`,
      },
      children,
    }];
  }

  private transformView(part: ViewPart, warnings: string[]): JsonRenderElement[] {
    switch (part.content.viewType) {
      case "table":
        return [this.transformTable(part)];
      case "list":
        return [this.transformList(part)];
      case "chart":
        return [this.transformChart(part)];
      default:
        warnings.push(`View type '${part.content.viewType}' converted to generic view in json-render`);
        return [{
          type: "DataView",
          props: {
            viewType: part.content.viewType,
            data: part.content.data,
            config: part.content.config,
          },
        }];
    }
  }

  private transformTable(part: ViewPart): JsonRenderElement {
    const data = part.content.data as Record<string, unknown>[];
    const columns = part.content.config?.columns as string[] || 
                   (data.length > 0 ? Object.keys(data[0]) : []);

    return {
      type: "Table",
      props: {
        columns: columns.map((col) => ({
          key: col,
          header: col,
          sortable: true,
        })),
        data: data,
        striped: true,
        hoverable: true,
      },
    };
  }

  private transformList(part: ViewPart): JsonRenderElement {
    const data = part.content.data as unknown[];
    
    return {
      type: "List",
      props: {
        items: data.map((item) => ({
          content: typeof item === "object" ? JSON.stringify(item) : String(item),
        })),
        variant: "bullet",
      },
    };
  }

  private transformChart(part: ViewPart): JsonRenderElement {
    return {
      type: "Chart",
      props: {
        chartType: part.content.config?.chartType || "bar",
        data: part.content.data,
        config: part.content.config,
      },
    };
  }

  private transformCase(caseData: Case): JsonRenderElement {
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);
    const currentStageName = currentStageIndex >= 0 
      ? caseData.stages[currentStageIndex].name 
      : caseData.status;

    return {
      type: "Card",
      props: {
        variant: "elevated",
        className: "border-l-4 border-blue-500",
      },
      children: [
        {
          type: "Text",
          props: {
            content: caseData.name,
            variant: "heading",
            className: "font-bold text-xl",
          },
        },
        {
          type: "MetricGrid",
          props: {
            metrics: [
              { label: "Case ID", value: caseData.id },
              { label: "Current Stage", value: currentStageName },
              { label: "Progress", value: `${currentStageIndex + 1} of ${caseData.stages.length}` },
            ],
          },
        },
      ],
    };
  }

  private transformCaseStatus(caseData: Case): JsonRenderElement {
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);

    return {
      type: "Stepper",
      props: {
        steps: caseData.stages.map((stage, index) => ({
          id: stage.id,
          label: stage.name,
          status: index < currentStageIndex ? "completed" : 
                  index === currentStageIndex ? "current" : "pending",
        })),
        currentStep: currentStageIndex,
      },
    };
  }

  private transformActions(actions: Action[]): JsonRenderElement[] {
    return actions.map((action) => ({
      type: "Button",
      props: {
        label: action.title,
        variant: action.style === "primary" ? "primary" : 
                 action.style === "danger" ? "destructive" : "secondary",
        disabled: action.disabled,
      },
      actions: {
        name: action.verb,
        params: {
          actionId: action.id,
          ...action.payload,
        },
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
