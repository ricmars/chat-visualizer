// Marketing Campaign Types for Simulation Mode
// This defines the workflow structure for marketing campaigns

export type CampaignStatus = 
  | "draft" 
  | "planning" 
  | "content_creation" 
  | "review" 
  | "approved" 
  | "active" 
  | "paused" 
  | "completed" 
  | "archived";

export type CampaignChannel = 
  | "email" 
  | "social_media" 
  | "paid_ads" 
  | "content_marketing" 
  | "seo" 
  | "events" 
  | "webinar" 
  | "influencer";

export type ContentType = 
  | "blog_post" 
  | "social_post" 
  | "email_template" 
  | "landing_page" 
  | "video_script" 
  | "infographic" 
  | "case_study" 
  | "whitepaper";

// Campaign Stage Definition
export interface CampaignStage {
  id: string;
  name: string;
  description: string;
  order: number;
  steps: CampaignStep[];
}

// Campaign Step Definition
export interface CampaignStep {
  id: string;
  name: string;
  description: string;
  order: number;
  type: "task" | "approval" | "milestone" | "automated";
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

// Content Asset
export interface ContentAsset {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  content?: string;
  status: "draft" | "in_review" | "approved" | "published";
  channel: CampaignChannel;
  createdAt: string;
  updatedAt: string;
}

// Target Audience
export interface TargetAudience {
  id: string;
  name: string;
  description: string;
  demographics: {
    ageRange?: string;
    location?: string[];
    interests?: string[];
    jobTitles?: string[];
    industries?: string[];
  };
  size?: number;
}

// Campaign Budget
export interface CampaignBudget {
  total: number;
  allocated: number;
  spent: number;
  currency: string;
  breakdown: {
    channel: CampaignChannel;
    amount: number;
    spent: number;
  }[];
}

// Campaign Metrics
export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  engagement: number;
  reach: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  roi: number;
}

// Marketing Campaign
export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  objective: string;
  status: CampaignStatus;
  channels: CampaignChannel[];
  stages: CampaignStage[];
  targetAudience: TargetAudience[];
  contentAssets: ContentAsset[];
  budget: CampaignBudget;
  metrics: CampaignMetrics;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Default stages for a marketing campaign workflow
export const DEFAULT_CAMPAIGN_STAGES: CampaignStage[] = [
  {
    id: "stage-1",
    name: "Planning",
    description: "Define campaign objectives, target audience, and strategy",
    order: 1,
    steps: [
      {
        id: "step-1-1",
        name: "Define Objectives",
        description: "Set clear, measurable campaign goals",
        order: 1,
        type: "task",
        completed: false,
      },
      {
        id: "step-1-2",
        name: "Identify Target Audience",
        description: "Research and define target demographics",
        order: 2,
        type: "task",
        completed: false,
      },
      {
        id: "step-1-3",
        name: "Select Channels",
        description: "Choose marketing channels based on audience",
        order: 3,
        type: "task",
        completed: false,
      },
      {
        id: "step-1-4",
        name: "Budget Allocation",
        description: "Allocate budget across channels",
        order: 4,
        type: "task",
        completed: false,
      },
      {
        id: "step-1-5",
        name: "Strategy Approval",
        description: "Get stakeholder approval on campaign strategy",
        order: 5,
        type: "approval",
        completed: false,
      },
    ],
  },
  {
    id: "stage-2",
    name: "Content Creation",
    description: "Develop all campaign content and creative assets",
    order: 2,
    steps: [
      {
        id: "step-2-1",
        name: "Create Content Calendar",
        description: "Plan content schedule across channels",
        order: 1,
        type: "task",
        completed: false,
      },
      {
        id: "step-2-2",
        name: "Develop Copy",
        description: "Write all campaign copy and messaging",
        order: 2,
        type: "task",
        completed: false,
      },
      {
        id: "step-2-3",
        name: "Design Creative Assets",
        description: "Create visual assets for the campaign",
        order: 3,
        type: "task",
        completed: false,
      },
      {
        id: "step-2-4",
        name: "Content Review",
        description: "Review all content for quality and brand alignment",
        order: 4,
        type: "approval",
        completed: false,
      },
    ],
  },
  {
    id: "stage-3",
    name: "Setup & Configuration",
    description: "Configure campaign in marketing platforms",
    order: 3,
    steps: [
      {
        id: "step-3-1",
        name: "Platform Setup",
        description: "Configure campaigns in ad platforms and email tools",
        order: 1,
        type: "task",
        completed: false,
      },
      {
        id: "step-3-2",
        name: "Tracking Setup",
        description: "Implement tracking pixels and UTM parameters",
        order: 2,
        type: "task",
        completed: false,
      },
      {
        id: "step-3-3",
        name: "A/B Test Configuration",
        description: "Set up A/B tests for key content variations",
        order: 3,
        type: "task",
        completed: false,
      },
      {
        id: "step-3-4",
        name: "QA Testing",
        description: "Test all links, tracking, and user flows",
        order: 4,
        type: "task",
        completed: false,
      },
    ],
  },
  {
    id: "stage-4",
    name: "Launch",
    description: "Execute and monitor campaign launch",
    order: 4,
    steps: [
      {
        id: "step-4-1",
        name: "Final Approval",
        description: "Get final go-ahead for launch",
        order: 1,
        type: "approval",
        completed: false,
      },
      {
        id: "step-4-2",
        name: "Campaign Activation",
        description: "Activate all campaign components",
        order: 2,
        type: "automated",
        completed: false,
      },
      {
        id: "step-4-3",
        name: "Launch Milestone",
        description: "Campaign officially launched",
        order: 3,
        type: "milestone",
        completed: false,
      },
    ],
  },
  {
    id: "stage-5",
    name: "Optimization",
    description: "Monitor performance and optimize campaign",
    order: 5,
    steps: [
      {
        id: "step-5-1",
        name: "Daily Monitoring",
        description: "Review daily metrics and performance",
        order: 1,
        type: "task",
        completed: false,
      },
      {
        id: "step-5-2",
        name: "Optimization Adjustments",
        description: "Make data-driven optimizations",
        order: 2,
        type: "task",
        completed: false,
      },
      {
        id: "step-5-3",
        name: "Mid-Campaign Review",
        description: "Comprehensive mid-point analysis",
        order: 3,
        type: "approval",
        completed: false,
      },
    ],
  },
  {
    id: "stage-6",
    name: "Analysis & Reporting",
    description: "Analyze results and document learnings",
    order: 6,
    steps: [
      {
        id: "step-6-1",
        name: "Data Collection",
        description: "Gather all campaign data and metrics",
        order: 1,
        type: "automated",
        completed: false,
      },
      {
        id: "step-6-2",
        name: "Performance Analysis",
        description: "Analyze campaign performance against goals",
        order: 2,
        type: "task",
        completed: false,
      },
      {
        id: "step-6-3",
        name: "ROI Calculation",
        description: "Calculate return on investment",
        order: 3,
        type: "task",
        completed: false,
      },
      {
        id: "step-6-4",
        name: "Final Report",
        description: "Create comprehensive campaign report",
        order: 4,
        type: "task",
        completed: false,
      },
      {
        id: "step-6-5",
        name: "Campaign Complete",
        description: "Campaign workflow completed",
        order: 5,
        type: "milestone",
        completed: false,
      },
    ],
  },
];

// Helper function to create a new campaign with default structure
export function createDefaultCampaign(
  name: string,
  description: string,
  objective: string
): MarketingCampaign {
  const now = new Date().toISOString();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);

  return {
    id: `campaign-${Date.now()}`,
    name,
    description,
    objective,
    status: "draft",
    channels: [],
    stages: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_STAGES)),
    targetAudience: [],
    contentAssets: [],
    budget: {
      total: 0,
      allocated: 0,
      spent: 0,
      currency: "USD",
      breakdown: [],
    },
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      engagement: 0,
      reach: 0,
      ctr: 0,
      conversionRate: 0,
      roi: 0,
    },
    startDate: now,
    endDate: endDate.toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}
