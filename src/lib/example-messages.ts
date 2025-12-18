import type { Conversation } from "./types"

export const exampleConversation: Conversation = {
  id: "example-conversation-1",
  title: "Data Analysis Example",
  messages: [
  {
    type: "ui_message",
    version: "1.0.0",
    role: "user",
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: "text",
        id: "user-text-1",
        content: "Can you help me analyze this data and create a visualization?",
      },
    ],
  },
  {
    type: "ui_message",
    version: "1.0.0",
    role: "assistant",
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: "text",
        id: "intro",
        content: "I'll help you analyze the data. Let me start by processing it:",
      },
      {
        type: "code",
        id: "py1",
        language: "python",
        filename: "data_analysis.py",
        content: `import pandas as pd
import matplotlib.pyplot as plt

# Load and process data
df = pd.read_csv('sales_data.csv')
summary = df.groupby('category').sum()

print(summary)`,
        status: "success",
        output: {
          type: "console_log",
          data: "Analysis complete. 3 categories processed with total revenue: $125,430",
        },
      },
      {
        type: "insight",
        id: "insight-1",
        content: {
          title: "Sales Performance Summary",
          description: "Your top performing category increased by 23% compared to last quarter.",
          severity: "success",
          metrics: [
            { label: "Total Revenue", value: "$125,430" },
            { label: "Growth Rate", value: "23%" },
            { label: "Top Category", value: "Electronics" },
          ],
        },
      },
      {
        type: "image",
        id: "chart1",
        url: "/sales-chart-visualization.jpg",
        altText: "Sales performance chart showing category breakdown",
        caption: "Quarterly sales by category",
      },
      {
        type: "markdown",
        id: "explanation",
        content: `## Analysis Results

Based on the data analysis:

- **Electronics** leads with 45% of total revenue
- **Clothing** shows steady growth at 12% increase
- **Home & Garden** remains stable with minor fluctuations

### Recommendations

1. Invest more in Electronics inventory
2. Run promotional campaigns for Clothing
3. Monitor Home & Garden trends closely`,
      },
    ],
    actions: [
      {
        id: "export-data",
        title: "Export Report",
        verb: "downloadFile",
        payload: {
          filename: "sales_report.pdf",
          url: "/api/export",
        },
        status: "idle",
      },
      {
        id: "rerun",
        title: "Rerun Analysis",
        verb: "rerunQuery",
        payload: {
          analysisId: "analysis-001",
        },
        status: "idle",
      },
    ],
  },
  {
    type: "ui_message",
    version: "1.0.0",
    role: "assistant",
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: "text",
        id: "code-demo",
        content: "Here's a JavaScript example with multiple status states:",
      },
      {
        type: "code",
        id: "js1",
        language: "javascript",
        filename: "api-handler.js",
        content: `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}`,
        status: "idle",
      },
      {
        type: "view",
        id: "table-view",
        content: {
          viewType: "table",
          data: [
            { id: 1, name: "Alice Johnson", status: "Active", revenue: 45230 },
            { id: 2, name: "Bob Smith", status: "Active", revenue: 38920 },
            { id: 3, name: "Carol Davis", status: "Pending", revenue: 12450 },
          ],
          config: {
            columns: ["id", "name", "status", "revenue"],
            sortable: true,
          },
        },
      },
    ],
    actions: [
      {
        id: "run-code",
        title: "Run Code",
        verb: "runAutomation",
        payload: { codeId: "js1" },
        status: "idle",
      },
      {
        id: "open-docs",
        title: "View Documentation",
        verb: "openUrl",
        payload: { url: "https://docs.example.com/api" },
        status: "idle",
      },
    ],
  },
  ],
}
