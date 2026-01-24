// Microsoft Adaptive Cards Transformer
// Transforms Pega ChatMessage to Adaptive Cards format
// Schema: https://adaptivecards.io/schemas/adaptive-card.json

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

// Adaptive Card Types
export interface AdaptiveCard {
  type: "AdaptiveCard";
  $schema: string;
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

export type AdaptiveCardElement = 
  | TextBlock 
  | RichTextBlock 
  | Image 
  | Container 
  | ColumnSet 
  | FactSet 
  | CodeBlock;

export interface TextBlock {
  type: "TextBlock";
  text: string;
  wrap?: boolean;
  weight?: "Default" | "Lighter" | "Bolder";
  size?: "Default" | "Small" | "Medium" | "Large" | "ExtraLarge";
  color?: "Default" | "Dark" | "Light" | "Accent" | "Good" | "Warning" | "Attention";
  isSubtle?: boolean;
  spacing?: "None" | "Small" | "Default" | "Medium" | "Large" | "ExtraLarge";
}

export interface RichTextBlock {
  type: "RichTextBlock";
  inlines: Array<{
    type: "TextRun";
    text: string;
    weight?: "Default" | "Lighter" | "Bolder";
    italic?: boolean;
    color?: string;
  }>;
}

export interface Image {
  type: "Image";
  url: string;
  altText?: string;
  size?: "Auto" | "Stretch" | "Small" | "Medium" | "Large";
  horizontalAlignment?: "Left" | "Center" | "Right";
}

export interface Container {
  type: "Container";
  items: AdaptiveCardElement[];
  style?: "default" | "emphasis" | "good" | "attention" | "warning" | "accent";
  spacing?: string;
}

export interface ColumnSet {
  type: "ColumnSet";
  columns: Column[];
}

export interface Column {
  type: "Column";
  width: "auto" | "stretch" | string;
  items: AdaptiveCardElement[];
}

export interface FactSet {
  type: "FactSet";
  facts: Array<{
    title: string;
    value: string;
  }>;
}

export interface CodeBlock {
  type: "CodeBlock";
  codeSnippet: string;
  language?: string;
}

export interface AdaptiveCardAction {
  type: "Action.Submit" | "Action.OpenUrl" | "Action.ShowCard";
  title: string;
  data?: Record<string, unknown>;
  url?: string;
}

/**
 * Transforms Pega ChatMessage to Microsoft Adaptive Cards format
 */
export class AdaptiveCardsTransformer implements PlatformTransformer<AdaptiveCard> {
  readonly platform = "adaptive-cards" as const;
  readonly name = "Microsoft Adaptive Cards";

  transform(message: ChatMessage): TransformResult<AdaptiveCard> {
    const warnings: string[] = [];
    
    const card: AdaptiveCard = {
      type: "AdaptiveCard",
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.5",
      body: [],
      actions: [],
    };

    // Add case header if present
    if (message.case) {
      card.body.push(this.transformCase(message.case));
    }

    // Transform each part
    for (const part of message.parts) {
      const elements = this.transformPart(part, message, warnings);
      card.body.push(...elements);

      // Collect actions from parts
      if (part.actions && part.actions.length > 0) {
        card.actions!.push(...this.transformActions(part.actions));
      }
    }

    // Remove empty actions array
    if (card.actions!.length === 0) {
      delete card.actions;
    }

    return {
      platform: this.platform,
      output: card,
      source: message,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private transformPart(
    part: MessagePart, 
    message: ChatMessage,
    warnings: string[]
  ): AdaptiveCardElement[] {
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
        warnings.push("RichText converted to plain text in Adaptive Cards");
        return [{
          type: "TextBlock",
          text: (part as { content: string }).content,
          wrap: true,
        }];
      default:
        warnings.push(`Unknown part type: ${(part as MessagePart).type}`);
        return [];
    }
  }

  private transformText(part: TextPart): AdaptiveCardElement[] {
    const isUser = part.role === "user";
    return [{
      type: "TextBlock",
      text: part.content,
      wrap: true,
      color: isUser ? "Accent" : "Default",
    }];
  }

  private transformMarkdown(part: MarkdownPart): AdaptiveCardElement[] {
    // Adaptive Cards support a subset of markdown
    return [{
      type: "TextBlock",
      text: part.content,
      wrap: true,
    }];
  }

  private transformCode(part: CodePart): AdaptiveCardElement[] {
    const elements: AdaptiveCardElement[] = [];

    // Add filename header if present
    if (part.filename) {
      elements.push({
        type: "TextBlock",
        text: `📄 ${part.filename}`,
        weight: "Bolder",
        size: "Small",
        spacing: "None",
      });
    }

    // Code block
    elements.push({
      type: "CodeBlock",
      codeSnippet: part.content,
      language: part.language,
    });

    // Add output if present
    if (part.output) {
      const outputColor = part.output.type === "error" ? "Attention" : "Good";
      elements.push({
        type: "TextBlock",
        text: `Output: ${part.output.data}`,
        wrap: true,
        color: outputColor,
        isSubtle: true,
        size: "Small",
      });
    }

    // Add status indicator if present
    if (part.status && part.status !== "idle") {
      const statusEmoji = {
        queued: "⏳",
        running: "▶️",
        success: "✅",
        error: "❌",
      }[part.status] || "";
      
      elements.push({
        type: "TextBlock",
        text: `${statusEmoji} Status: ${part.status}`,
        size: "Small",
        isSubtle: true,
      });
    }

    return elements;
  }

  private transformImage(part: ImagePart): AdaptiveCardElement[] {
    const elements: AdaptiveCardElement[] = [];

    elements.push({
      type: "Image",
      url: part.url,
      altText: part.altText,
      size: "Large",
      horizontalAlignment: "Center",
    });

    if (part.caption) {
      elements.push({
        type: "TextBlock",
        text: part.caption,
        wrap: true,
        isSubtle: true,
        horizontalAlignment: "Center",
        size: "Small",
      } as TextBlock);
    }

    return elements;
  }

  private transformInsight(part: InsightPart): AdaptiveCardElement[] {
    const severityStyle = {
      info: "accent",
      success: "good",
      warning: "warning",
      error: "attention",
    }[part.content.severity || "info"] as Container["style"];

    const elements: AdaptiveCardElement[] = [];

    // Create container with severity styling
    const container: Container = {
      type: "Container",
      style: severityStyle,
      items: [
        {
          type: "TextBlock",
          text: part.content.title,
          weight: "Bolder",
          size: "Medium",
        },
        {
          type: "TextBlock",
          text: part.content.description,
          wrap: true,
        },
      ],
    };

    // Add metrics as FactSet if present
    if (part.content.metrics && part.content.metrics.length > 0) {
      container.items.push({
        type: "FactSet",
        facts: part.content.metrics.map((m) => ({
          title: m.label,
          value: String(m.value),
        })),
      });
    }

    elements.push(container);
    return elements;
  }

  private transformView(part: ViewPart, warnings: string[]): AdaptiveCardElement[] {
    const elements: AdaptiveCardElement[] = [];

    switch (part.content.viewType) {
      case "table":
        elements.push(this.transformTable(part));
        break;
      case "list":
        elements.push(this.transformList(part));
        break;
      default:
        warnings.push(`View type '${part.content.viewType}' not fully supported in Adaptive Cards`);
        elements.push({
          type: "TextBlock",
          text: `[${part.content.viewType} view]`,
          isSubtle: true,
        });
    }

    return elements;
  }

  private transformTable(part: ViewPart): Container {
    const data = part.content.data as Record<string, unknown>[];
    const columns = part.content.config?.columns as string[] || 
                   (data.length > 0 ? Object.keys(data[0]) : []);

    // Create header row
    const headerColumns: Column[] = columns.map((col) => ({
      type: "Column",
      width: "stretch",
      items: [{
        type: "TextBlock",
        text: col,
        weight: "Bolder",
      }],
    }));

    // Create data rows
    const dataRows: ColumnSet[] = data.map((row) => ({
      type: "ColumnSet",
      columns: columns.map((col) => ({
        type: "Column",
        width: "stretch",
        items: [{
          type: "TextBlock",
          text: String(row[col] ?? ""),
          wrap: true,
        }],
      })),
    }));

    return {
      type: "Container",
      items: [
        {
          type: "ColumnSet",
          columns: headerColumns,
        },
        ...dataRows,
      ],
    };
  }

  private transformList(part: ViewPart): Container {
    const data = part.content.data as unknown[];
    
    return {
      type: "Container",
      items: data.map((item) => ({
        type: "TextBlock",
        text: `• ${typeof item === "object" ? JSON.stringify(item) : String(item)}`,
        wrap: true,
      })),
    };
  }

  private transformCase(caseData: Case): Container {
    // Find current stage index
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);
    const currentStageName = currentStageIndex >= 0 
      ? caseData.stages[currentStageIndex].name 
      : caseData.status;

    return {
      type: "Container",
      style: "accent",
      items: [
        {
          type: "TextBlock",
          text: caseData.name,
          weight: "Bolder",
          size: "Large",
        },
        {
          type: "FactSet",
          facts: [
            { title: "Case ID", value: caseData.id },
            { title: "Current Stage", value: currentStageName },
            { title: "Progress", value: `${currentStageIndex + 1} of ${caseData.stages.length}` },
          ],
        },
      ],
    };
  }

  private transformCaseStatus(caseData: Case): Container {
    const currentStageIndex = caseData.stages.findIndex(s => s.id === caseData.status);
    
    // Create stage progress columns
    const stageColumns: Column[] = caseData.stages.map((stage, index) => {
      const isCompleted = index < currentStageIndex;
      const isCurrent = index === currentStageIndex;
      
      return {
        type: "Column",
        width: "auto",
        items: [{
          type: "TextBlock",
          text: `${isCompleted ? "✅" : isCurrent ? "🔵" : "⚪"} ${stage.name}`,
          size: "Small",
          weight: isCurrent ? "Bolder" : "Default",
          color: isCurrent ? "Accent" : isCompleted ? "Good" : "Default",
        }],
      };
    });

    return {
      type: "Container",
      items: [
        {
          type: "TextBlock",
          text: "Workflow Progress",
          weight: "Bolder",
          spacing: "Medium",
        },
        {
          type: "ColumnSet",
          columns: stageColumns,
        },
      ],
    };
  }

  private transformActions(actions: Action[]): AdaptiveCardAction[] {
    return actions.map((action) => {
      // Map our action verbs to Adaptive Card actions
      switch (action.verb) {
        case "openUrl":
          return {
            type: "Action.OpenUrl" as const,
            title: action.title,
            url: action.payload?.url as string || "#",
          };
        case "submitForm":
        case "rerunQuery":
        case "runAutomation":
        default:
          return {
            type: "Action.Submit" as const,
            title: action.title,
            data: {
              actionId: action.id,
              verb: action.verb,
              ...action.payload,
            },
          };
      }
    });
  }

  supports(feature: string): boolean {
    const supportedFeatures = [
      "text", "markdown", "code", "image", "insight", 
      "view:table", "view:list", "case", "actions"
    ];
    return supportedFeatures.includes(feature);
  }
}
