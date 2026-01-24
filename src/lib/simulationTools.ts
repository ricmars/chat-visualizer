// Simulation Tools for Marketing Campaign Generation
// These tools are used by OpenAI to generate marketing campaign data

import type { ChatCompletionTool } from "openai/resources/chat/completions";
import {
  type MarketingCampaign,
  type CampaignStep,
  type ContentAsset,
  type TargetAudience,
  type CampaignChannel,
  type ContentType,
  createDefaultCampaign,
} from "./marketingCampaignTypes";
import type { ChatMessage, Case, CaseStage, MessagePart, InsightPart, ViewPart as ViewPartType } from "./types";

// Field definition for data collection
export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect" | "date" | "textarea";
  description?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number;
}

// Collected field values
export interface CollectedFields {
  [key: string]: string | number | string[] | undefined;
}

// In-memory storage for simulation
const campaignStore = new Map<string, MarketingCampaign>();

// Tool interface
export interface SimulationTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  execute: (params: unknown) => Promise<unknown>;
}

// Create simulation tools
export function createSimulationTools(): SimulationTool[] {
  return [
    {
      name: "createCampaign",
      description:
        "Creates a new marketing campaign with default workflow stages. Returns the campaign ID and initial structure. Use this to start a new campaign workflow.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the marketing campaign",
          },
          description: {
            type: "string",
            description: "A brief description of the campaign",
          },
          objective: {
            type: "string",
            description:
              "The primary objective of the campaign (e.g., 'Increase brand awareness', 'Generate leads', 'Drive sales')",
          },
          channels: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "email",
                "social_media",
                "paid_ads",
                "content_marketing",
                "seo",
                "events",
                "webinar",
                "influencer",
              ],
            },
            description: "Marketing channels to use for this campaign",
          },
          budget: {
            type: "number",
            description: "Total campaign budget in USD",
          },
          startDate: {
            type: "string",
            description: "Campaign start date (ISO format)",
          },
          endDate: {
            type: "string",
            description: "Campaign end date (ISO format)",
          },
        },
        required: ["name", "description", "objective"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          name: string;
          description: string;
          objective: string;
          channels?: CampaignChannel[];
          budget?: number;
          startDate?: string;
          endDate?: string;
        };

        const campaign = createDefaultCampaign(
          p.name,
          p.description,
          p.objective
        );

        if (p.channels) {
          campaign.channels = p.channels;
          // Update budget breakdown for selected channels
          const budgetPerChannel = (p.budget || 10000) / p.channels.length;
          campaign.budget.breakdown = p.channels.map((channel) => ({
            channel,
            amount: budgetPerChannel,
            spent: 0,
          }));
        }

        if (p.budget) {
          campaign.budget.total = p.budget;
          campaign.budget.allocated = p.budget;
        }

        if (p.startDate) campaign.startDate = p.startDate;
        if (p.endDate) campaign.endDate = p.endDate;

        campaignStore.set(campaign.id, campaign);

        return {
          success: true,
          campaign: campaign,
          message: `Created campaign '${campaign.name}' with ${campaign.stages.length} stages`,
        };
      },
    },
    {
      name: "updateCampaignStage",
      description:
        "Updates a specific stage in a campaign workflow. Can modify stage details or add/update steps.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID",
          },
          stageId: {
            type: "string",
            description: "The stage ID to update",
          },
          name: {
            type: "string",
            description: "New name for the stage",
          },
          description: {
            type: "string",
            description: "New description for the stage",
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                type: {
                  type: "string",
                  enum: ["task", "approval", "milestone", "automated"],
                },
                assignee: { type: "string" },
                dueDate: { type: "string" },
              },
            },
            description: "Steps to add or update in this stage",
          },
        },
        required: ["campaignId", "stageId"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          campaignId: string;
          stageId: string;
          name?: string;
          description?: string;
          steps?: Partial<CampaignStep>[];
        };

        const campaign = campaignStore.get(p.campaignId);
        if (!campaign) {
          throw new Error(`Campaign ${p.campaignId} not found`);
        }

        const stage = campaign.stages.find((s) => s.id === p.stageId);
        if (!stage) {
          throw new Error(`Stage ${p.stageId} not found in campaign`);
        }

        if (p.name) stage.name = p.name;
        if (p.description) stage.description = p.description;

        if (p.steps) {
          for (const stepUpdate of p.steps) {
            if (stepUpdate.id) {
              const existingStep = stage.steps.find(
                (s) => s.id === stepUpdate.id
              );
              if (existingStep) {
                Object.assign(existingStep, stepUpdate);
              } else {
                stage.steps.push({
                  id: stepUpdate.id,
                  name: stepUpdate.name || "New Step",
                  description: stepUpdate.description || "",
                  order: stage.steps.length + 1,
                  type: stepUpdate.type || "task",
                  assignee: stepUpdate.assignee,
                  dueDate: stepUpdate.dueDate,
                  completed: false,
                } as CampaignStep);
              }
            }
          }
        }

        campaign.updatedAt = new Date().toISOString();

        return {
          success: true,
          stage: stage,
          message: `Updated stage '${stage.name}'`,
        };
      },
    },
    {
      name: "addTargetAudience",
      description:
        "Adds a target audience segment to a campaign with demographic details.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID",
          },
          name: {
            type: "string",
            description: "Name of the audience segment",
          },
          description: {
            type: "string",
            description: "Description of this audience",
          },
          ageRange: {
            type: "string",
            description: "Target age range (e.g., '25-45')",
          },
          locations: {
            type: "array",
            items: { type: "string" },
            description: "Geographic locations to target",
          },
          interests: {
            type: "array",
            items: { type: "string" },
            description: "Interests and hobbies",
          },
          jobTitles: {
            type: "array",
            items: { type: "string" },
            description: "Target job titles (for B2B)",
          },
          industries: {
            type: "array",
            items: { type: "string" },
            description: "Target industries (for B2B)",
          },
          estimatedSize: {
            type: "number",
            description: "Estimated audience size",
          },
        },
        required: ["campaignId", "name", "description"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          campaignId: string;
          name: string;
          description: string;
          ageRange?: string;
          locations?: string[];
          interests?: string[];
          jobTitles?: string[];
          industries?: string[];
          estimatedSize?: number;
        };

        const campaign = campaignStore.get(p.campaignId);
        if (!campaign) {
          throw new Error(`Campaign ${p.campaignId} not found`);
        }

        const audience: TargetAudience = {
          id: `audience-${Date.now()}`,
          name: p.name,
          description: p.description,
          demographics: {
            ageRange: p.ageRange,
            location: p.locations,
            interests: p.interests,
            jobTitles: p.jobTitles,
            industries: p.industries,
          },
          size: p.estimatedSize,
        };

        campaign.targetAudience.push(audience);
        campaign.updatedAt = new Date().toISOString();

        return {
          success: true,
          audience: audience,
          message: `Added audience segment '${audience.name}'`,
        };
      },
    },
    {
      name: "createContentAsset",
      description:
        "Creates a content asset for the campaign (blog post, email, social post, etc.).",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID",
          },
          type: {
            type: "string",
            enum: [
              "blog_post",
              "social_post",
              "email_template",
              "landing_page",
              "video_script",
              "infographic",
              "case_study",
              "whitepaper",
            ],
            description: "Type of content asset",
          },
          title: {
            type: "string",
            description: "Title of the content",
          },
          description: {
            type: "string",
            description: "Brief description of the content",
          },
          content: {
            type: "string",
            description: "The actual content (text, HTML, or markdown)",
          },
          channel: {
            type: "string",
            enum: [
              "email",
              "social_media",
              "paid_ads",
              "content_marketing",
              "seo",
              "events",
              "webinar",
              "influencer",
            ],
            description: "Channel this content is for",
          },
        },
        required: ["campaignId", "type", "title", "description", "channel"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          campaignId: string;
          type: ContentType;
          title: string;
          description: string;
          content?: string;
          channel: CampaignChannel;
        };

        const campaign = campaignStore.get(p.campaignId);
        if (!campaign) {
          throw new Error(`Campaign ${p.campaignId} not found`);
        }

        const now = new Date().toISOString();
        const asset: ContentAsset = {
          id: `content-${Date.now()}`,
          type: p.type,
          title: p.title,
          description: p.description,
          content: p.content,
          status: "draft",
          channel: p.channel,
          createdAt: now,
          updatedAt: now,
        };

        campaign.contentAssets.push(asset);
        campaign.updatedAt = now;

        return {
          success: true,
          asset: asset,
          message: `Created ${p.type} '${asset.title}'`,
        };
      },
    },
    {
      name: "updateCampaignStatus",
      description:
        "Updates the status of a campaign and optionally marks steps as completed.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID",
          },
          status: {
            type: "string",
            enum: [
              "draft",
              "planning",
              "content_creation",
              "review",
              "approved",
              "active",
              "paused",
              "completed",
              "archived",
            ],
            description: "New campaign status",
          },
          completedSteps: {
            type: "array",
            items: { type: "string" },
            description: "Array of step IDs to mark as completed",
          },
        },
        required: ["campaignId"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          campaignId: string;
          status?: string;
          completedSteps?: string[];
        };

        const campaign = campaignStore.get(p.campaignId);
        if (!campaign) {
          throw new Error(`Campaign ${p.campaignId} not found`);
        }

        if (p.status) {
          campaign.status = p.status as MarketingCampaign["status"];
        }

        if (p.completedSteps) {
          const now = new Date().toISOString();
          for (const stage of campaign.stages) {
            for (const step of stage.steps) {
              if (p.completedSteps.includes(step.id)) {
                step.completed = true;
                step.completedAt = now;
              }
            }
          }
        }

        campaign.updatedAt = new Date().toISOString();

        return {
          success: true,
          campaign: campaign,
          message: `Updated campaign status to '${campaign.status}'`,
        };
      },
    },
    {
      name: "getCampaign",
      description: "Retrieves a campaign by ID with all its details.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID to retrieve",
          },
        },
        required: ["campaignId"],
      },
      execute: async (params: unknown) => {
        const p = params as { campaignId: string };
        const campaign = campaignStore.get(p.campaignId);

        if (!campaign) {
          throw new Error(`Campaign ${p.campaignId} not found`);
        }

        return {
          success: true,
          campaign: campaign,
        };
      },
    },
    {
      name: "listCampaigns",
      description: "Lists all campaigns in the system.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter by campaign status",
          },
        },
        required: [],
      },
      execute: async (params: unknown) => {
        const p = params as { status?: string };
        let campaigns = Array.from(campaignStore.values());

        if (p.status) {
          campaigns = campaigns.filter((c) => c.status === p.status);
        }

        return {
          success: true,
          campaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            channels: c.channels,
            startDate: c.startDate,
            endDate: c.endDate,
          })),
          total: campaigns.length,
        };
      },
    },
    {
      name: "generateChatMessage",
      description:
        "Generates a ChatMessage object in the application's JSON format. Use this to create properly formatted UI messages with campaign data.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "Campaign ID to include case data from",
          },
          parts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "text",
                    "markdown",
                    "richText",
                    "code",
                    "image",
                    "view",
                    "insight",
                    "case",
                  ],
                },
                content: {
                  type: "string",
                  description: "Content for text/markdown/richText parts",
                },
              },
            },
            description: "Message parts to include",
          },
          includeCase: {
            type: "boolean",
            description:
              "Whether to include campaign as case data in the message",
          },
        },
        required: ["parts"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          campaignId?: string;
          parts: Array<{
            type: string;
            content?: string;
            id?: string;
          }>;
          includeCase?: boolean;
        };

        const message: ChatMessage = {
          type: "ui_message",
          version: "1.0",
          timestamp: new Date().toISOString(),
          parts: p.parts.map((part, index) => ({
            type: part.type,
            id: part.id || `part-${Date.now()}-${index}`,
            content: part.content || "",
          })) as MessagePart[],
        };

        // Add case data if campaign ID provided and includeCase is true
        if (p.campaignId && p.includeCase !== false) {
          const campaign = campaignStore.get(p.campaignId);
          if (campaign) {
            // Convert campaign stages to case stages
            const caseStages: CaseStage[] = campaign.stages.map((stage) => ({
              id: stage.id,
              name: stage.name,
            }));

            // Determine current stage based on completion
            let currentStageId = campaign.stages[0]?.id || "stage-1";
            for (const stage of campaign.stages) {
              const allCompleted = stage.steps.every((step) => step.completed);
              if (!allCompleted) {
                currentStageId = stage.id;
                break;
              }
            }

            const caseData: Case = {
              id: campaign.id,
              name: campaign.name,
              status: currentStageId,
              stages: caseStages,
            };

            message.case = caseData;

            // Add case part if not already present
            const hasCasePart = message.parts.some(
              (part) => part.type === "case"
            );
            if (!hasCasePart) {
              message.parts.push({
                type: "case",
                id: `case-part-${Date.now()}`,
                content: {
                  campaignName: campaign.name,
                  objective: campaign.objective,
                  status: campaign.status,
                  channels: campaign.channels,
                  budget: campaign.budget,
                },
              } as MessagePart);
            }
          }
        }

        return {
          success: true,
          message: message,
        };
      },
    },
    {
      name: "askForFields",
      description:
        "Creates a message asking the user to provide specific information. Use this when you need to collect data from the user to proceed with their request. The message will include a markdown explanation and an insight card showing the fields needed.",
      parameters: {
        type: "object",
        properties: {
          stepName: {
            type: "string",
            description: "Name of the current step in the workflow (e.g., 'Campaign Details', 'Target Audience')",
          },
          stepDescription: {
            type: "string",
            description: "Brief description explaining what information is needed and why",
          },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Field identifier (used internally)",
                },
                label: {
                  type: "string",
                  description: "Human-readable label for the field",
                },
                type: {
                  type: "string",
                  enum: ["text", "number", "select", "multiselect", "date", "textarea"],
                  description: "Type of input field",
                },
                description: {
                  type: "string",
                  description: "Help text explaining what to enter",
                },
                required: {
                  type: "boolean",
                  description: "Whether the field is required",
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description: "Options for select/multiselect fields",
                },
              },
              required: ["name", "label", "type"],
            },
            description: "List of fields to collect from the user",
          },
          campaignId: {
            type: "string",
            description: "Optional campaign ID to include case progress in the response",
          },
        },
        required: ["stepName", "stepDescription", "fields"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          stepName: string;
          stepDescription: string;
          fields: FieldDefinition[];
          campaignId?: string;
        };

        // Build the markdown content explaining what's needed
        const fieldsMarkdown = p.fields.map(f => {
          let fieldLine = `- **${f.label}**${f.required ? ' (required)' : ''}`;
          if (f.description) {
            fieldLine += `: ${f.description}`;
          }
          if (f.type === 'select' || f.type === 'multiselect') {
            fieldLine += `\n  Options: ${f.options?.join(', ') || 'None specified'}`;
          }
          return fieldLine;
        }).join('\n');

        const markdownContent = `## ${p.stepName}\n\n${p.stepDescription}\n\nPlease provide the following information:\n\n${fieldsMarkdown}\n\nYou can respond naturally with the information, and I'll process it accordingly.`;

        // Create insight card showing required fields count
        const requiredCount = p.fields.filter(f => f.required).length;
        const insightPart: InsightPart = {
          type: "insight",
          id: `insight-${Date.now()}`,
          content: {
            title: p.stepName,
            description: `${p.fields.length} fields to collect (${requiredCount} required)`,
            severity: "info",
            metrics: [
              { label: "Total Fields", value: p.fields.length },
              { label: "Required", value: requiredCount },
              { label: "Optional", value: p.fields.length - requiredCount },
            ],
          },
        };

        // Build the message parts
        const parts: MessagePart[] = [
          {
            type: "markdown",
            id: `md-${Date.now()}`,
            content: markdownContent,
            role: "assistant",
          },
          insightPart,
        ];

        // Add case data if campaign exists
        let caseData: Case | undefined;
        if (p.campaignId) {
          const campaign = campaignStore.get(p.campaignId);
          if (campaign) {
            const caseStages: CaseStage[] = campaign.stages.map((stage) => ({
              id: stage.id,
              name: stage.name,
            }));

            let currentStageId = campaign.stages[0]?.id || "stage-1";
            for (const stage of campaign.stages) {
              const allCompleted = stage.steps.every((step) => step.completed);
              if (!allCompleted) {
                currentStageId = stage.id;
                break;
              }
            }

            caseData = {
              id: campaign.id,
              name: campaign.name,
              status: currentStageId,
              stages: caseStages,
            };

            parts.push({
              type: "case",
              id: `case-${Date.now()}`,
            } as MessagePart);
          }
        }

        const message: ChatMessage = {
          type: "ui_message",
          version: "1.0",
          timestamp: new Date().toISOString(),
          parts,
          case: caseData,
        };

        return {
          success: true,
          message,
          fieldsRequested: p.fields.map(f => f.name),
        };
      },
    },
    {
      name: "displayProgress",
      description:
        "Creates a message showing the current progress and collected data. Use this to confirm what information has been gathered and show next steps.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title for the progress update",
          },
          summary: {
            type: "string",
            description: "Summary of what has been accomplished",
          },
          collectedData: {
            type: "object",
            description: "Object containing the data that has been collected",
          },
          nextSteps: {
            type: "array",
            items: { type: "string" },
            description: "List of upcoming steps",
          },
          campaignId: {
            type: "string",
            description: "Campaign ID to show progress for",
          },
        },
        required: ["title", "summary", "campaignId"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          title: string;
          summary: string;
          collectedData?: Record<string, unknown>;
          nextSteps?: string[];
          campaignId: string;
        };

        const campaign = campaignStore.get(p.campaignId);
        
        // Build collected data display
        let dataDisplay = "";
        if (p.collectedData && Object.keys(p.collectedData).length > 0) {
          dataDisplay = "\n\n### Collected Information\n" + 
            Object.entries(p.collectedData)
              .map(([key, value]) => `- **${key}**: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
        }

        // Build next steps display
        let nextStepsDisplay = "";
        if (p.nextSteps && p.nextSteps.length > 0) {
          nextStepsDisplay = "\n\n### Next Steps\n" + 
            p.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
        }

        const markdownContent = `## ${p.title}\n\n${p.summary}${dataDisplay}${nextStepsDisplay}`;

        const parts: MessagePart[] = [
          {
            type: "markdown",
            id: `md-${Date.now()}`,
            content: markdownContent,
            role: "assistant",
          },
        ];

        // Add view part for collected data table if there's data
        if (p.collectedData && Object.keys(p.collectedData).length > 0) {
          const viewPart: ViewPartType = {
            type: "view",
            id: `view-${Date.now()}`,
            content: {
              viewType: "table",
              data: Object.entries(p.collectedData).map(([key, value]) => ({
                Field: key,
                Value: Array.isArray(value) ? value.join(', ') : String(value),
              })),
              config: {
                columns: ["Field", "Value"],
              },
            },
          };
          parts.push(viewPart);
        }

        // Add case data if campaign exists
        let caseData: Case | undefined;
        if (campaign) {
          const caseStages: CaseStage[] = campaign.stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
          }));

          let currentStageId = campaign.stages[0]?.id || "stage-1";
          for (const stage of campaign.stages) {
            const allCompleted = stage.steps.every((step) => step.completed);
            if (!allCompleted) {
              currentStageId = stage.id;
              break;
            }
          }

          caseData = {
            id: campaign.id,
            name: campaign.name,
            status: currentStageId,
            stages: caseStages,
          };

          parts.push({
            type: "case",
            id: `case-${Date.now()}`,
          } as MessagePart);
        }

        const message: ChatMessage = {
          type: "ui_message",
          version: "1.0",
          timestamp: new Date().toISOString(),
          parts,
          case: caseData,
        };

        return {
          success: true,
          message,
        };
      },
    },
    {
      name: "createStructuredResponse",
      description:
        "Creates a complete ChatMessage response with multiple part types. Use this as the primary way to respond to users with rich content including text, insights, views, and case data.",
      parameters: {
        type: "object",
        properties: {
          textContent: {
            type: "string",
            description: "Main text or markdown content for the response",
          },
          contentType: {
            type: "string",
            enum: ["text", "markdown"],
            description: "Type of the main content (text or markdown)",
          },
          insight: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: {
                type: "string",
                enum: ["info", "warning", "error", "success"],
              },
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    value: { type: ["string", "number"] },
                  },
                },
              },
            },
            description: "Optional insight card to include",
          },
          tableData: {
            type: "object",
            properties: {
              rows: {
                type: "array",
                items: { type: "object" },
              },
              columns: {
                type: "array",
                items: { type: "string" },
              },
            },
            description: "Optional table data to display",
          },
          campaignId: {
            type: "string",
            description: "Campaign ID to include case data",
          },
          includeCase: {
            type: "boolean",
            description: "Whether to show the case workflow card",
          },
        },
        required: ["textContent"],
      },
      execute: async (params: unknown) => {
        const p = params as {
          textContent: string;
          contentType?: "text" | "markdown";
          insight?: {
            title: string;
            description: string;
            severity?: "info" | "warning" | "error" | "success";
            metrics?: Array<{ label: string; value: string | number }>;
          };
          tableData?: {
            rows: Record<string, unknown>[];
            columns?: string[];
          };
          campaignId?: string;
          includeCase?: boolean;
        };

        const parts: MessagePart[] = [];
        const contentType = p.contentType || "markdown";

        // Add main content
        parts.push({
          type: contentType,
          id: `${contentType}-${Date.now()}`,
          content: p.textContent,
          role: "assistant",
        } as MessagePart);

        // Add insight if provided
        if (p.insight) {
          const insightPart: InsightPart = {
            type: "insight",
            id: `insight-${Date.now()}`,
            content: {
              title: p.insight.title,
              description: p.insight.description,
              severity: p.insight.severity || "info",
              metrics: p.insight.metrics,
            },
          };
          parts.push(insightPart);
        }

        // Add table view if provided
        if (p.tableData && p.tableData.rows.length > 0) {
          const viewPart: ViewPartType = {
            type: "view",
            id: `view-${Date.now()}`,
            content: {
              viewType: "table",
              data: p.tableData.rows,
              config: p.tableData.columns ? { columns: p.tableData.columns } : undefined,
            },
          };
          parts.push(viewPart);
        }

        // Add case data if campaign exists and includeCase is true
        let caseData: Case | undefined;
        if (p.campaignId && p.includeCase !== false) {
          const campaign = campaignStore.get(p.campaignId);
          if (campaign) {
            const caseStages: CaseStage[] = campaign.stages.map((stage) => ({
              id: stage.id,
              name: stage.name,
            }));

            let currentStageId = campaign.stages[0]?.id || "stage-1";
            for (const stage of campaign.stages) {
              const allCompleted = stage.steps.every((step) => step.completed);
              if (!allCompleted) {
                currentStageId = stage.id;
                break;
              }
            }

            caseData = {
              id: campaign.id,
              name: campaign.name,
              status: currentStageId,
              stages: caseStages,
            };

            parts.push({
              type: "case",
              id: `case-${Date.now()}`,
            } as MessagePart);
          }
        }

        const message: ChatMessage = {
          type: "ui_message",
          version: "1.0",
          timestamp: new Date().toISOString(),
          parts,
          case: caseData,
        };

        return {
          success: true,
          message,
        };
      },
    },
  ];
}

// Convert simulation tools to OpenAI tool schema format
export function getSimulationToolSchemas(): ChatCompletionTool[] {
  const tools = createSimulationTools();
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// Get tool by name
export function getSimulationTool(name: string): SimulationTool | undefined {
  const tools = createSimulationTools();
  return tools.find((t) => t.name === name);
}
