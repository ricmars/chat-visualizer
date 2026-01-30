import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import {
  getOutputSchemaForPlatform,
  getSystemPromptForPlatform,
} from "../../../src/lib/schemas/ai-output.schema";
import {
  transformMessage,
  type PlatformType,
} from "../../../src/lib/transformers";
import type { ChatMessage } from "../../../src/lib/types";

// Debug logging
console.log("Bedrock Route Environment Variables:", {
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2",
  profile: process.env.AWS_PROFILE,
});

// Create Bedrock client with AWS credentials from profile
function createBedrockClient() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
  const profile = process.env.AWS_PROFILE;

  console.log("Creating Bedrock client with region:", region, "profile:", profile);

  const credentials = fromNodeProviderChain({
    profile: profile,
  });

  return new BedrockRuntimeClient({
    region,
    credentials,
  });
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

// Convert messages to Anthropic format
function convertToAnthropicMessages(history: unknown[], userPrompt: string) {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item) continue;

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
        messages.push({
          role: historyItem.role,
          content: historyItem.content,
        });
      } else if (historyItem.type === "ui_message" && historyItem.parts) {
        const textParts = historyItem.parts
          .filter((p) => p.type === "text" || p.type === "markdown")
          .map((p) => p.content || "")
          .join("\n");

        if (textParts) {
          const hasUserPart = historyItem.parts.some((p) => p.role === "user");
          messages.push({
            role: hasUserPart ? "user" : "assistant",
            content: textParts,
          });
        }
      }
    }
  }

  // Add current user message
  messages.push({
    role: "user",
    content: userPrompt,
  });

  return messages;
}

export async function POST(request: Request) {
  console.log("=== Bedrock POST request started ===");
  const startTime = Date.now();

  try {
    const {
      prompt,
      systemContext,
      history,
      model,
      outputPlatform = "pega",
    } = await request.json();

    console.log("Received request with prompt:", prompt?.substring(0, 100));
    console.log("Platform:", outputPlatform);

    // Determine model
    const selectedModel =
      (typeof model === "string" && model.trim()) ||
      process.env.BEDROCK_MODEL_ID ||
      "us.anthropic.claude-sonnet-4-20250514-v1:0";
    console.log("Using Bedrock model:", selectedModel);

    // Create Bedrock client
    const bedrock = createBedrockClient();

    // Create streaming response
    const { writer, encoder, response } = createStreamResponse();

    const safeWrite = async (obj: unknown) => {
      try {
        const data = `data: ${JSON.stringify(obj)}\n\n`;
        await writer.write(encoder.encode(data));
      } catch (writeError) {
        console.error("safeWrite error:", writeError);
      }
    };

    // Handle generation in background
    const handleGeneration = async () => {
      try {
        await handleStructuredOutputMode(
          bedrock,
          selectedModel,
          prompt,
          systemContext,
          history,
          outputPlatform as PlatformType,
          safeWrite,
          writer
        );
        console.log(
          `=== Bedrock generation completed in ${Date.now() - startTime}ms ===`
        );
      } catch (error) {
        console.error("Error in generation handler:", error);
        try {
          await safeWrite({
            error: error instanceof Error ? error.message : "Generation error",
          });
          await safeWrite({ done: true });
          await writer.close();
        } catch {
          // Ignore cleanup errors
        }
      }
    };

    // Start generation in background
    handleGeneration();

    console.log(
      `=== Returning streaming response after ${Date.now() - startTime}ms ===`
    );
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
 * Handle structured output mode using Anthropic's prompt caching and response format
 */
async function handleStructuredOutputMode(
  bedrock: BedrockRuntimeClient,
  modelId: string,
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

    // Convert messages to Anthropic format
    const messages = convertToAnthropicMessages(history, prompt);

    console.log(`Calling Bedrock with model: ${modelId}`);
    console.log(`Messages count: ${messages.length}`);
    console.log(`Output schema name: ${outputSchema.name}`);

    // Prepare request body for Anthropic Claude via Bedrock
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      system: fullSystemPrompt,
      messages: messages,
      // For structured output, we need to guide Claude with the schema
      // Anthropic doesn't have native JSON schema support like OpenAI,
      // so we'll include it in the system prompt
    };

    // Append schema instructions to system prompt for structured output
    const schemaInstructions = `\n\nIMPORTANT: You must respond with valid JSON that strictly follows this schema:\n${JSON.stringify(outputSchema.schema, null, 2)}\n\nYour entire response must be valid JSON matching this schema. Do not include any text before or after the JSON.`;
    requestBody.system += schemaInstructions;

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    console.log("Invoking Bedrock model...");
    const bedrockResponse = await bedrock.send(command);

    if (!bedrockResponse.body) {
      throw new Error("No response body from Bedrock");
    }

    // Process the stream
    let fullContent = "";
    const decoder = new TextDecoder();

    for await (const chunk of bedrockResponse.body) {
      if (chunk.chunk?.bytes) {
        const chunkText = decoder.decode(chunk.chunk.bytes);
        try {
          const parsed = JSON.parse(chunkText);

          // Handle different event types from Claude
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            const text = parsed.delta.text;
            fullContent += text;
            // Stream text to client
            await safeWrite({ text });
          } else if (parsed.type === "message_stop") {
            console.log("Message generation completed");
          }
        } catch (parseError) {
          console.error("Failed to parse chunk:", chunkText);
        }
      }
    }

    console.log("Full content length:", fullContent.length);

    // Parse the full response as JSON
    if (fullContent) {
      try {
        // Extract JSON from content (in case there's any wrapper text)
        let jsonContent = fullContent.trim();
        
        // Try to find JSON object boundaries
        const jsonStart = jsonContent.indexOf('{');
        const jsonEnd = jsonContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
        }

        console.log("Parsing structured output...");
        const parsedOutput = JSON.parse(jsonContent);
        console.log("Parsed output successfully");

        if (outputPlatform === "pega") {
          // Pega format - ensure timestamp and send as chatMessage
          console.log("Processing as Pega format...");
          const chatMessage = parsedOutput as ChatMessage;
          if (!chatMessage.timestamp) {
            chatMessage.timestamp = new Date().toISOString();
          }
          await safeWrite({ chatMessage });
        } else {
          // Format-native output
          console.log(`Processing as ${outputPlatform} format...`);
          await safeWrite({
            formatOutput: parsedOutput,
            platform: outputPlatform,
          });
        }
      } catch (parseError) {
        console.error("Failed to parse structured output:", parseError);
        console.error("Raw content:", fullContent);
        // Fallback: send as text
        await safeWrite({ text: fullContent });
      }
    }

    await safeWrite({ done: true });
    await writer.close();
  } catch (error) {
    console.error("Error in structured output mode:", error);

    let errorMessage = "An error occurred while generating the response.";

    if (error instanceof Error) {
      const errorStr = error.message;

      if (errorStr.includes("credentials")) {
        errorMessage =
          "AWS credentials error. Please ensure your AWS profile is configured correctly.";
      } else if (errorStr.includes("AccessDeniedException")) {
        errorMessage =
          "Access denied. Please check your AWS permissions for Bedrock.";
      } else if (errorStr.includes("ThrottlingException")) {
        errorMessage = "Request throttled. Please wait a moment and try again.";
      } else if (errorStr.includes("ValidationException")) {
        errorMessage = `Invalid request: ${errorStr}`;
      } else {
        errorMessage = errorStr;
      }
    }

    await safeWrite({ error: errorMessage });
    await safeWrite({ done: true });
    await writer.close();
  }
}