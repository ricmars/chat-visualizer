import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  createSimulationTools,
  getSimulationToolSchemas,
} from "../../../src/lib/simulationTools";
import { 
  getOutputSchemaForPlatform,
  getSystemPromptForPlatform
} from "../../../src/lib/schemas/ai-output.schema";
import { 
  transformMessage, 
  type PlatformType 
} from "../../../src/lib/transformers";
import type { ChatMessage } from "../../../src/lib/types";

// Debug logging
console.log("OpenAI Route Environment Variables:", {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  hasClientId: !!process.env.AZURE_CLIENT_ID,
  hasClientSecret: !!process.env.AZURE_CLIENT_SECRET,
  hasTenantId: !!process.env.AZURE_TENANT_ID,
});

// Cache for Azure access token
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get Azure AD token with caching
async function getAzureAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    console.log("Using cached Azure access token");
    return cachedToken.token;
  }

  console.log("Getting Azure access token...");
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const scope = "https://cognitiveservices.azure.com/.default";

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope: scope,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token response error:", errorText);
    throw new Error(
      `Failed to get Azure access token: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("Token received successfully");

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };

  return data.access_token;
}

// Create OpenAI client with Azure AD token
async function createOpenAIClient(deploymentId: string) {
  console.log("Creating OpenAI client...");
  const token = await getAzureAccessToken();
  // Remove trailing slash from endpoint if present to avoid double slashes
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, '') || '';
  const baseURL = `${endpoint}/openai/deployments/${deploymentId}`;
  console.log("OpenAI base URL:", baseURL);

  const client = new OpenAI({
    apiKey: "dummy",
    baseURL: baseURL,
    defaultQuery: { "api-version": "2024-12-01-preview" },
    defaultHeaders: { Authorization: `Bearer ${token}` },
  });

  return client;
}

// Stream response helpers
function createStreamResponse() {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const response = new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  return { stream, writer, encoder, response };
}

// Tool call accumulator
interface ToolCall {
  index: number;
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Generation modes
type _GenerationMode = "tools" | "structured";

// System prompt for tool-based mode (legacy)
const TOOL_BASED_SYSTEM_PROMPT = `You are a marketing campaign assistant that helps users create and manage marketing campaigns through an interactive conversational interface.

## CRITICAL: Response Format Requirements

You MUST use the response tools (createStructuredResponse, askForFields, displayProgress) to generate ALL responses to the user. Never respond with plain text - always use tools to create properly formatted ChatMessage objects.

## Available Tools

### Data Collection Tools:
- **askForFields**: Use this to request information from the user. Creates a rich message showing what fields are needed.
- **displayProgress**: Use this to show what data has been collected and what comes next.

### Campaign Management Tools:
- **createCampaign**: Creates a new marketing campaign with default workflow stages
- **addTargetAudience**: Adds audience segments with demographic details
- **createContentAsset**: Creates content like blog posts, emails, social media posts
- **updateCampaignStatus**: Updates campaign status and marks steps complete
- **updateCampaignStage**: Modifies specific stages in a campaign

### Response Tools:
- **createStructuredResponse**: Primary tool for generating responses. Creates rich messages with text, insights, tables, and case data.
- **generateChatMessage**: Low-level tool for custom message structures

## Campaign Workflow Stages
1. Planning - Define objectives, audiences, and strategy
2. Content Creation - Develop all campaign content  
3. Setup & Configuration - Configure platforms and tracking
4. Launch - Activate the campaign
5. Optimization - Monitor and optimize performance
6. Analysis & Reporting - Analyze results and report

## Important Rules
- ALWAYS use tools to respond - never use plain text responses
- Use markdown formatting in text content for better readability
- Include the campaignId in responses once a campaign is created to show workflow progress
- Be conversational but efficient in collecting data
- Use insight cards to highlight key information
- Use tables to display structured data like audience segments or content plans`;

export async function POST(request: Request) {
  console.log("=== OpenAI POST request started ===");
  const startTime = Date.now();

  try {
    const { 
      prompt, 
      systemContext, 
      history, 
      mode, 
      model,
      generationMode = "structured", // "structured" (default) or "tools"
      outputPlatform = "pega"   // Platform for output transformation
    } = await request.json();
    
    console.log("Received request with prompt:", prompt?.substring(0, 100));
    console.log("Mode:", mode, "Generation:", generationMode, "Platform:", outputPlatform);

    // Determine deployment
    const selectedDeployment =
      (typeof model === "string" && model.trim()) ||
      process.env.AZURE_OPENAI_DEPLOYMENT ||
      "gpt-4o";
    console.log("Using deployment:", selectedDeployment);

    // Create OpenAI client
    const openai = await createOpenAIClient(selectedDeployment);

    // Create streaming response
    const { writer, encoder, response } = createStreamResponse();

    const safeWrite = async (obj: unknown) => {
      try {
        const data = `data: ${JSON.stringify(obj)}\n\n`;
        await writer.write(encoder.encode(data));
      } catch (writeError) {
        console.error("safeWrite error:", writeError);
        // Ignore write errors but log them
      }
    };

    // Choose generation mode
    // IMPORTANT: Don't await here - start the async work and return the response immediately
    // This allows streaming to work properly
    const handleGeneration = async () => {
      try {
        if (generationMode === "structured") {
          // NEW: Structured Outputs mode - AI generates ChatMessage directly
          await handleStructuredOutputMode(
            openai,
            selectedDeployment,
            prompt,
            systemContext,
            history,
            outputPlatform as PlatformType,
            safeWrite,
            writer
          );
        } else {
          // LEGACY: Tool-based mode
          await handleToolBasedMode(
            openai,
            selectedDeployment,
            prompt,
            systemContext,
            history,
            outputPlatform as PlatformType,
            safeWrite,
            writer
          );
        }
        console.log(
          `=== OpenAI generation completed in ${Date.now() - startTime}ms ===`
        );
      } catch (error) {
        console.error("Error in generation handler:", error);
        try {
          await safeWrite({ error: error instanceof Error ? error.message : "Generation error" });
          await safeWrite({ done: true });
          await writer.close();
        } catch {
          // Ignore cleanup errors
        }
      }
    };

    // Start generation in background (don't await)
    handleGeneration();

    console.log(`=== Returning streaming response after ${Date.now() - startTime}ms ===`);
    return response;
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * NEW: Handle structured output mode using OpenAI's response_format
 * Now supports generating format-native output directly (A2UI, json-render, Adaptive Cards)
 */
async function handleStructuredOutputMode(
  openai: OpenAI,
  deployment: string,
  prompt: string,
  systemContext: string | undefined,
  history: unknown[],
  outputPlatform: PlatformType,
  safeWrite: (obj: unknown) => Promise<void>,
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  try {
    // Get format-specific system prompt and schema
    const systemPrompt = getSystemPromptForPlatform(outputPlatform);
    const outputSchema = getOutputSchemaForPlatform(outputPlatform);
    
    // Add additional context if provided
    const fullSystemPrompt = systemContext 
      ? `${systemPrompt}\n\nAdditional context: ${systemContext}`
      : systemPrompt;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: fullSystemPrompt },
    ];

    // Add history
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item) continue;
        
        // Type assertion for history items
        const historyItem = item as {
          role?: string;
          content?: string;
          type?: string;
          parts?: Array<{ type: string; content?: string; role?: string }>;
        };
        
        if (
          (historyItem.role === "user" || historyItem.role === "assistant") &&
          typeof historyItem.content === "string"
        ) {
          messages.push({ role: historyItem.role, content: historyItem.content });
        } else if (historyItem.type === "ui_message" && historyItem.parts) {
          const textParts = historyItem.parts
            .filter((p) => p.type === "text" || p.type === "markdown")
            .map((p) => p.content || "")
            .join("\n");
          
          if (textParts) {
            const hasUserPart = historyItem.parts.some((p) => p.role === "user");
            messages.push({ 
              role: hasUserPart ? "user" : "assistant", 
              content: textParts 
            });
          }
        }
      }
    }

    messages.push({ role: "user", content: prompt });

    console.log(`Calling OpenAI with structured output for platform: ${outputPlatform}`);
    console.log(`Messages count: ${messages.length}`);
    console.log(`Output schema name: ${outputSchema.name}`);
    
    const openAICallStart = Date.now();
    console.log(`>>> OpenAI API call starting at ${new Date().toISOString()}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(">>> OpenAI API call timeout - aborting after 60 seconds");
      controller.abort();
    }, 60000); // 60 second timeout
    
    // Use format-specific output schema
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: deployment,
        messages,
        max_completion_tokens: 4000,
        response_format: {
          type: "json_schema",
          json_schema: outputSchema,
        },
      }, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log(`<<< OpenAI API call completed in ${Date.now() - openAICallStart}ms`);
    } catch (openAIError) {
      clearTimeout(timeoutId);
      console.error(`<<< OpenAI API call FAILED after ${Date.now() - openAICallStart}ms`);
      console.error("OpenAI error details:", openAIError);
      if (openAIError instanceof Error && openAIError.name === "AbortError") {
        throw new Error("OpenAI request timed out after 60 seconds. Please try again.");
      }
      throw openAIError;
    }

    console.log("Completion received, extracting content...");
    console.log("Completion choices:", completion.choices?.length);
    console.log("Finish reason:", completion.choices[0]?.finish_reason);
    console.log("Usage:", JSON.stringify(completion.usage));
    
    const content = completion.choices[0]?.message?.content;
    console.log("Content length:", content?.length ?? 0);
    console.log("Content preview:", content?.substring(0, 200));
    
    if (content) {
      try {
        console.log("Parsing structured output...");
        // Parse the structured output
        const parsedOutput = JSON.parse(content);
        console.log("Parsed output successfully");
        
        if (outputPlatform === "pega") {
          // Pega format - ensure timestamp and send as chatMessage
          console.log("Processing as Pega format...");
          const chatMessage = parsedOutput as ChatMessage;
          if (!chatMessage.timestamp) {
            chatMessage.timestamp = new Date().toISOString();
          }
          console.log("Writing chatMessage to stream...");
          await safeWrite({ chatMessage });
          console.log("chatMessage written to stream");
        } else {
          // Format-native output - send the raw format directly
          // The UI will render it using the appropriate preview component
          console.log(`Processing as ${outputPlatform} format...`);
          await safeWrite({ 
            formatOutput: parsedOutput,
            platform: outputPlatform,
          });
          console.log("formatOutput written to stream");
        }
      } catch (parseError) {
        console.error("Failed to parse structured output:", parseError);
        console.error("Raw content that failed to parse:", content);
        // Fallback: send as text
        await safeWrite({ text: content });
      }
    } else {
      console.warn("No content in completion response");
    }

    console.log("Writing done signal to stream...");
    await safeWrite({ done: true });
    console.log("Closing writer...");
    await writer.close();
    console.log("Writer closed successfully");
  } catch (error) {
    console.error("Error in structured output mode:", error);
    
    // Format a user-friendly error message
    let errorMessage = "An error occurred while generating the response.";
    
    if (error instanceof Error) {
      const errorStr = error.message;
      
      // Check for schema validation errors
      if (errorStr.includes("Invalid schema for response_format")) {
        errorMessage = `Schema validation error for ${outputPlatform} format. The output schema may be invalid. Please try a different format or contact support.`;
        console.error("Schema error details:", errorStr);
      } 
      // Check for rate limiting
      else if (errorStr.includes("429") || errorStr.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      }
      // Check for authentication errors
      else if (errorStr.includes("401") || errorStr.includes("authentication")) {
        errorMessage = "Authentication error. Please check your API configuration.";
      }
      // Check for token/content length errors
      else if (errorStr.includes("context_length") || errorStr.includes("max_tokens")) {
        errorMessage = "The conversation is too long. Please start a new conversation.";
      }
      // General API errors
      else if (errorStr.includes("400")) {
        errorMessage = `Bad request: ${errorStr}`;
      }
      else {
        errorMessage = errorStr;
      }
    }
    
    await safeWrite({
      error: errorMessage,
    });
    await safeWrite({ done: true });
    await writer.close();
  }
}


/**
 * LEGACY: Handle tool-based mode
 */
async function handleToolBasedMode(
  openai: OpenAI,
  deployment: string,
  prompt: string,
  systemContext: string | undefined,
  history: unknown[],
  outputPlatform: PlatformType,
  safeWrite: (obj: unknown) => Promise<void>,
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  const simulationTools = createSimulationTools();
  const toolSchemas = getSimulationToolSchemas();

  let systemPrompt = TOOL_BASED_SYSTEM_PROMPT;
  if (systemContext) {
    systemPrompt += `\n\nAdditional context: ${systemContext}`;
  }

  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item) continue;
        
        // Type assertion for history items
        const historyItem = item as {
          role?: string;
          content?: string;
          type?: string;
          parts?: Array<{ type: string; content?: string; role?: string }>;
        };
        
        if (
          (historyItem.role === "user" || historyItem.role === "assistant") &&
          typeof historyItem.content === "string"
        ) {
          messages.push({ role: historyItem.role, content: historyItem.content });
        } else if (historyItem.type === "ui_message" && historyItem.parts) {
          const textParts = historyItem.parts
            .filter((p) => p.type === "text" || p.type === "markdown")
            .map((p) => p.content || "")
            .join("\n");
          
          if (textParts) {
            const hasUserPart = historyItem.parts.some((p) => p.role === "user");
            messages.push({ 
              role: hasUserPart ? "user" : "assistant", 
              content: textParts 
            });
          }
        }
      }
    }

    messages.push({ role: "user", content: prompt });

    let loopCount = 0;
    let done = false;
    const MAX_LOOPS = 15;
    const MAX_TOOL_EXECUTIONS = 30;
    let totalToolExecutions = 0;
    let sentStructuredMessage = false;

    while (!done && loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`=== Tool loop iteration ${loopCount} ===`);

      const completion = await openai.chat.completions.create({
        model: deployment,
        messages,
        max_completion_tokens: 4000,
        stream: true,
        tools: toolSchemas,
      });

      let fullContent = "";
      let toolCalls: ToolCall[] = [];
      let finishReason = "";

      for await (const chunk of completion) {
        const choice = chunk.choices[0];

        if (choice?.delta?.content) {
          fullContent += choice.delta.content;
          if (!sentStructuredMessage) {
            await safeWrite({ text: choice.delta.content });
          }
        }

        if (choice?.delta?.tool_calls) {
          for (const toolCall of choice.delta.tool_calls) {
            const existingIndex = toolCalls.findIndex(
              (tc) => tc.index === toolCall.index
            );
            if (existingIndex >= 0) {
              if (toolCall.function?.name) {
                toolCalls[existingIndex].function.name = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                toolCalls[existingIndex].function.arguments += toolCall.function.arguments;
              }
            } else {
              toolCalls.push({
                index: toolCall.index,
                id: toolCall.id || `call-${Date.now()}-${toolCall.index}`,
                type: "function",
                function: {
                  name: toolCall.function?.name || "",
                  arguments: toolCall.function?.arguments || "",
                },
              });
            }
          }
        }

        if (choice?.finish_reason) {
          finishReason = choice.finish_reason;
        }
      }

      console.log(`Finish reason: ${finishReason}`);
      console.log(`Tool calls: ${toolCalls.length}`);

      if (finishReason !== "tool_calls" || toolCalls.length === 0) {
        done = true;
        break;
      }

      if (toolCalls.length > 0 && totalToolExecutions < MAX_TOOL_EXECUTIONS) {
        const assistantMessage = {
          role: "assistant" as const,
          content: fullContent || null,
          tool_calls: toolCalls,
        };
        messages.push(assistantMessage);

        for (const toolCall of toolCalls) {
          if (totalToolExecutions >= MAX_TOOL_EXECUTIONS) {
            await safeWrite({ text: `\nReached tool execution limit. Stopping.` });
            break;
          }

          const toolName = toolCall.function.name;
          let toolArgs: unknown = {};

          try {
            toolArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            console.error("Failed to parse tool arguments:", toolCall.function.arguments);
          }

          console.log(`Executing tool: ${toolName}`);

          try {
            const tool = simulationTools.find((t) => t.name === toolName);
            if (!tool) {
              throw new Error(`Tool ${toolName} not found`);
            }

            totalToolExecutions++;
            const result = await tool.execute(toolArgs);
            console.log(`Tool ${toolName} completed`);

            const responseTools = [
              "createStructuredResponse", 
              "askForFields", 
              "displayProgress", 
              "generateChatMessage"
            ];
            
            if (responseTools.includes(toolName)) {
              const r = result as { message?: ChatMessage };
              if (r.message) {
                // Transform if needed
                if (outputPlatform !== "pega") {
                  const transformed = transformMessage(r.message, outputPlatform);
                  await safeWrite({ 
                    chatMessage: r.message,
                    transformed: transformed.output,
                    platform: outputPlatform,
                    warnings: transformed.warnings 
                  });
                } else {
                  await safeWrite({ chatMessage: r.message });
                }
                sentStructuredMessage = true;
              }
            } else if (toolName === "createCampaign") {
              const r = result as { campaign?: { name: string; id: string } };
              console.log(`Created campaign: ${r.campaign?.name}`);
            } else if (toolName === "addTargetAudience") {
              const r = result as { audience?: { name: string } };
              console.log(`Added audience: ${r.audience?.name}`);
            } else if (toolName === "createContentAsset") {
              const r = result as { asset?: { title: string; type: string } };
              console.log(`Created content: ${r.asset?.title}`);
            }

            messages.push({
              role: "tool",
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            });
          } catch (err) {
            console.error(`Tool ${toolName} failed:`, err);
            await safeWrite({ error: `Error executing ${toolName}: ${err}` });
            messages.push({
              role: "tool",
              content: JSON.stringify({ error: String(err) }),
              tool_call_id: toolCall.id,
            });
          }
        }
      }
    }

    await safeWrite({ done: true });
    await writer.close();
  } catch (error) {
    console.error("Error in tool-based mode:", error);
    await safeWrite({
      error: error instanceof Error ? error.message : String(error),
    });
    await safeWrite({ done: true });
    await writer.close();
  }
}
