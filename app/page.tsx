"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import conversationSchema from "@/lib/schemas/chat-message.schema.json";
import type { Conversation, ChatMessage } from "@/lib/types";
import type { AttachedFile } from "@/components/message-input";
import { 
  transformConversation, 
  getAvailablePlatforms,
  type PlatformType 
} from "@/lib/transformers";

// Dynamic imports for components that use Pega Cosmos (which requires HTMLElement)
const Providers = dynamic(() => import("@/components/providers").then(mod => ({ default: mod.Providers })), { ssr: false });
const JsonEditor = dynamic(() => import("@/components/json-editor").then(mod => ({ default: mod.JsonEditor })), { ssr: false });
const ChatRenderer = dynamic(() => import("@/components/chat-renderer").then(mod => ({ default: mod.ChatRenderer })), { ssr: false });
const CaseDetailView = dynamic(() => import("@/components/case-detail-view").then(mod => ({ default: mod.CaseDetailView })), { ssr: false });
const SimulationChatView = dynamic(() => import("@/components/simulation-chat-view").then(mod => ({ default: mod.SimulationChatView })), { ssr: false });
const JsonRenderPreview = dynamic(() => import("@/components/json-render-preview").then(mod => ({ default: mod.JsonRenderPreview })), { ssr: false });
const A2UIPreview = dynamic(() => import("@/components/a2ui-preview").then(mod => ({ default: mod.A2UIPreview })), { ssr: false });
const AdaptiveCardsPreview = dynamic(() => import("@/components/adaptive-cards-preview").then(mod => ({ default: mod.AdaptiveCardsPreview })), { ssr: false });

// Import types for simulation messages
import type { SimulationMessage, FormatNativeMessage } from "@/components/simulation-chat-view";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: rgb(234, 236, 246);
`;

const Header = styled.header`
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
`;

const HeaderContent = styled.div`
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconContainer = styled.div`
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #3f57e4;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const ModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModeButton = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.$active ? "#3f57e4" : "#e5e7eb")};
  background: ${(props) => (props.$active ? "#3f57e4" : "#fff")};
  color: ${(props) => (props.$active ? "#fff" : "#374151")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3f57e4;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Panel = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}px;
  min-width: 300px;
  max-width: 80%;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
`;

const ChatPanel = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}px;
  min-width: 300px;
  max-width: 80%;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
`;

const DetailPanel = styled.div`
  flex: 1;
  min-width: 0;
  margin: 1rem;
`;

const ResizeHandle = styled.div`
  width: 4px;
  background: #e5e7eb;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  &:hover {
    background: #3f57e4;
  }
`;

const SimulationContainer = styled.div`
  min-width: 650px;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
`;

const PreviewPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px 24px;
  text-align: center;
  background: #f9fafb;
`;

const PlaceholderIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 32px;
    height: 32px;
    color: #9ca3af;
  }
`;

const PlaceholderTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const PlaceholderDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  max-width: 300px;
  line-height: 1.5;
`;

const FormatDropdown = styled.select`
  padding: 6px 32px 6px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 180px;

  &:hover {
    border-color: #3f57e4;
  }

  &:focus {
    outline: none;
    border-color: #3f57e4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
`;

const FormatLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  margin-right: 4px;
`;

// Sample configurations per format - defined outside component to avoid recreating on each render
const samplesByFormat: Record<PlatformType, { path: string; name: string }[]> = {
  pega: [
    { path: "samples/pega/case-example.json", name: "Case Example" },
    { path: "samples/pega/data-analysis.json", name: "Data Analysis" },
    { path: "samples/pega/javascript-example.json", name: "JavaScript Example" },
  ],
  "adaptive-cards": [
    { path: "samples/adaptive-cards/case-example.json", name: "Case Example" },
    { path: "samples/adaptive-cards/data-analysis.json", name: "Data Analysis" },
  ],
  "json-render": [
    { path: "samples/json-render/case-example.json", name: "Case Example" },
    { path: "samples/json-render/data-analysis.json", name: "Data Analysis" },
    { path: "samples/json-render/dashboard.json", name: "Dashboard" },
  ],
  "google-a2ui": [
    { path: "samples/a2ui/case-example.json", name: "Case Example" },
    { path: "samples/a2ui/data-analysis.json", name: "Data Analysis" },
    { path: "samples/a2ui/forms-example.json", name: "Forms Example" },
  ],
  "slack-blocks": [], // No samples yet
};

export default function Page() {
  const [jsonValue, setJsonValue] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null
  );
  const [currentSample, setCurrentSample] = useState<string>("samples/pega/case-example.json");
  const [mode, setMode] = useState<"visualizer" | "simulation">("visualizer");
  
  // Format transformation state
  const [outputFormat, setOutputFormat] = useState<PlatformType>("pega");
  const [transformedJson, setTransformedJson] = useState<string>("");
  const availablePlatforms = getAvailablePlatforms();

  // Simulation state - new chat-based interface
  const [simulationMessages, setSimulationMessages] = useState<SimulationMessage[]>([]);
  const [simulationHistory, setSimulationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Available models
  const availableModels = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  ];
  
  // Simulation output format
  const [simulationOutputFormat, setSimulationOutputFormat] = useState<PlatformType>("pega");

  // Clear simulation chat
  const handleClearSimulation = useCallback(() => {
    setSimulationMessages([]);
    setSimulationHistory([]);
    setStreamingText("");
  }, []);

  // Panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(600);
  const [chatPanelWidth, setChatPanelWidth] = useState(650);

  // Resize state
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartLeftWidth = useRef(0);
  const resizeStartChatWidth = useRef(0);

  useEffect(() => {
    const loadInitialSample = async () => {
      try {
        const response = await fetch("/samples/pega/case-example.json");
        if (!response.ok) {
          throw new Error("Failed to load initial sample");
        }
        const json = await response.json();
        const initialJson = JSON.stringify(json, null, 2);
        setJsonValue(initialJson);
        setConversation(json);
        setCurrentSample("samples/pega/case-example.json");
      } catch (error) {
        console.error("Error loading initial sample:", error);
      }
    };
    loadInitialSample();
  }, []);

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.messages) {
        setConversation(parsed);
        setSelectedMessage(null);
      }
    } catch {
      // Invalid JSON
    }
  };

  const handleSampleLoad = async (samplePath: string) => {
    setCurrentSample(samplePath);
    setSelectedMessage(null);
    
    try {
      const response = await fetch(`/${samplePath}`);
      if (response.ok) {
        const json = await response.json();
        const prettified = JSON.stringify(json, null, 2);
        
        if (outputFormat === "pega") {
          // For Pega format, load into editor and update conversation for chat preview
          setJsonValue(prettified);
          if (json && typeof json === "object" && json.messages) {
            setConversation(json);
          }
        } else {
          // For other formats, just load the JSON into the transformed view
          setTransformedJson(prettified);
        }
      }
    } catch (error) {
      console.error("Error loading sample:", error);
    }
  };
  
  // Transform conversation when format changes
  const handleTransform = useCallback(() => {
    if (!conversation || outputFormat === "pega") {
      setTransformedJson("");
      return;
    }
    
    try {
      const results = transformConversation(conversation.messages, outputFormat);
      const transformedData = {
        id: conversation.id + "-" + outputFormat,
        title: conversation.title + ` (${outputFormat})`,
        platform: outputFormat,
        cards: results.map(r => r.output),
        warnings: results.flatMap(r => r.warnings || [])
      };
      setTransformedJson(JSON.stringify(transformedData, null, 2));
    } catch (error) {
      console.error("Transform error:", error);
      setTransformedJson(JSON.stringify({ error: String(error) }, null, 2));
    }
  }, [conversation, outputFormat]);
  
  // Handle format change - load appropriate sample
  useEffect(() => {
    const loadSampleForFormat = async () => {
      const formatSamples = samplesByFormat[outputFormat];
      if (!formatSamples || formatSamples.length === 0) return;

      const firstSample = formatSamples[0].path;
      setCurrentSample(firstSample);

      if (outputFormat === "pega") {
        // Load Pega sample into the editor
        try {
          const response = await fetch(`/${firstSample}`);
          if (response.ok) {
            const json = await response.json();
            setJsonValue(JSON.stringify(json, null, 2));
            setConversation(json);
          }
        } catch (error) {
          console.error("Error loading Pega sample:", error);
        }
      } else {
        // Load the format-specific sample directly
        try {
          const response = await fetch(`/${firstSample}`);
          if (response.ok) {
            const json = await response.json();
            setTransformedJson(JSON.stringify(json, null, 2));
          }
        } catch (error) {
          console.error("Error loading sample:", error);
        }
      }
    };

    loadSampleForFormat();
  }, [outputFormat]);
  
  // Auto-transform when conversation changes (only for Pega format)
  useEffect(() => {
    if (outputFormat === "pega") {
      handleTransform();
    }
  }, [handleTransform, outputFormat]);

  const handleSimulationSend = useCallback(async (message: string, attachments: AttachedFile[]) => {
    if ((!message.trim() && attachments.length === 0) || isSimulating) return;

    // Create user message
    const userMessage: ChatMessage = {
      type: "ui_message",
      version: "1.0",
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: "text",
          id: `user-${Date.now()}`,
          content: message,
          role: "user",
        },
      ],
    };

    // Add attachments as image parts if they are images
    for (const attachment of attachments) {
      if (attachment.type.startsWith("image/") && attachment.dataUrl) {
        userMessage.parts.push({
          type: "image",
          id: `img-${attachment.id}`,
          url: attachment.dataUrl,
          altText: attachment.name,
          role: "user",
        } as unknown as typeof userMessage.parts[0]);
      }
    }

    // Add user message to conversation
    setSimulationMessages((prev) => [...prev, userMessage]);
    
    // Add to history for context
    const newHistory = [...simulationHistory, { role: "user", content: message }];
    setSimulationHistory(newHistory);

    setIsSimulating(true);
    setStreamingText("");

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message,
          mode: "simulation",
          model: selectedModel,
          history: simulationHistory,
          generationMode: "structured", // Always use structured outputs
          outputPlatform: simulationOutputFormat,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle streaming text (fallback when no tools used)
              if (data.text) {
                accumulatedText += data.text;
                setStreamingText(accumulatedText);
              }
              
              // Handle structured ChatMessage (Pega format) - wrap as format_native for consistency
              if (data.chatMessage) {
                const pegaMessage = data.chatMessage as ChatMessage;
                const formatMessage: FormatNativeMessage = {
                  type: "format_native",
                  platform: "pega",
                  content: pegaMessage,
                  timestamp: new Date().toISOString(),
                };
                setSimulationMessages((prev) => [...prev, formatMessage]);
                
                // Extract text content for history
                const textContent = pegaMessage.parts
                  .filter((p) => p.type === "text" || p.type === "markdown")
                  .map((p) => (p as { content: string }).content)
                  .join("\n");
                
                if (textContent) {
                  setSimulationHistory((prev) => [
                    ...prev,
                    { role: "assistant", content: textContent },
                  ]);
                }
                
                // Clear streaming text since we got a structured message
                setStreamingText("");
                accumulatedText = "";
              }
              
              // Handle format-native output (A2UI, json-render, Adaptive Cards)
              if (data.formatOutput && data.platform) {
                const formatMessage: FormatNativeMessage = {
                  type: "format_native",
                  platform: data.platform as PlatformType,
                  content: data.formatOutput,
                  timestamp: new Date().toISOString(),
                };
                setSimulationMessages((prev) => [...prev, formatMessage]);
                
                // Add a summary to history for context
                setSimulationHistory((prev) => [
                  ...prev,
                  { role: "assistant", content: `[Generated ${data.platform} format response]` },
                ]);
                
                // Clear streaming text
                setStreamingText("");
                accumulatedText = "";
              }
              
              // Handle errors
              if (data.error) {
                console.error("API error:", data.error);
                // Create an error message with insight styling for visibility
                const errorMessage: ChatMessage = {
                  type: "ui_message",
                  version: "1.0",
                  timestamp: new Date().toISOString(),
                  parts: [
                    {
                      type: "insight",
                      id: `error-${Date.now()}`,
                      role: "assistant",
                      content: {
                        title: "Error",
                        description: data.error,
                        severity: "error",
                      },
                    } as unknown as ChatMessage["parts"][0],
                  ],
                };
                setSimulationMessages((prev) => [...prev, errorMessage]);
                
                // Clear any streaming state
                setStreamingText("");
                accumulatedText = "";
              }
              
              // Handle completion
              if (data.done) {
                // If we have accumulated text but no structured message, create a text message
                if (accumulatedText && !data.chatMessage && !data.formatOutput) {
                  const textMessage: ChatMessage = {
                    type: "ui_message",
                    version: "1.0",
                    timestamp: new Date().toISOString(),
                    parts: [
                      {
                        type: "markdown",
                        id: `text-${Date.now()}`,
                        content: accumulatedText,
                        role: "assistant",
                      },
                    ],
                  };
                  setSimulationMessages((prev) => [...prev, textMessage]);
                  setSimulationHistory((prev) => [
                    ...prev,
                    { role: "assistant", content: accumulatedText },
                  ]);
                }
                setStreamingText("");
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Simulation error:", error);
      const errorMessage: ChatMessage = {
        type: "ui_message",
        version: "1.0",
        timestamp: new Date().toISOString(),
        parts: [
          {
            type: "text",
            id: `error-${Date.now()}`,
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            role: "assistant",
          },
        ],
      };
      setSimulationMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSimulating(false);
      setStreamingText("");
    }
  }, [isSimulating, simulationHistory, selectedModel, simulationOutputFormat]);

  // Resize handlers
  const handleLeftResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingLeft(true);
      resizeStartX.current = e.clientX;
      resizeStartLeftWidth.current = leftPanelWidth;
    },
    [leftPanelWidth]
  );

  const handleRightResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingRight(true);
      resizeStartX.current = e.clientX;
      resizeStartChatWidth.current = chatPanelWidth;
    },
    [chatPanelWidth]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const deltaX = e.clientX - resizeStartX.current;
        const newWidth = Math.max(
          300,
          Math.min(window.innerWidth * 0.8, resizeStartLeftWidth.current + deltaX)
        );
        setLeftPanelWidth(newWidth);
      } else if (isResizingRight) {
        const deltaX = e.clientX - resizeStartX.current;
        const newWidth = Math.max(
          300,
          Math.min(window.innerWidth * 0.8, resizeStartChatWidth.current + deltaX)
        );
        setChatPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight]);

  return (
    <Providers>
      <PageContainer>
        <Header>
          <HeaderContent>
            <HeaderInner>
              <IconContainer>
                <svg width="16" height="16" viewBox="0 0 25 25" fill="white">
                  <path d="M3.5 2.5h18a1 1 0 011 1v14a1 1 0 01-1 1h-4.586l-4.707 4.707a1 1 0 01-1.414 0L6.086 18.5H3.5a1 1 0 01-1-1v-14a1 1 0 011-1zm1 2v12h2.414l4.586 4.586 4.586-4.586H20.5v-12h-16z"/>
                </svg>
              </IconContainer>
              <Title>AI Chat Message Visualizer</Title>
              <span style={{ color: "#e5e7eb", margin: "0 12px" }}>|</span>
              <FormatLabel>Output Format:</FormatLabel>
              {mode === "visualizer" ? (
                <FormatDropdown
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as PlatformType)}
                >
                  {availablePlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </FormatDropdown>
              ) : (
                <FormatDropdown
                  value={simulationOutputFormat}
                  onChange={(e) => {
                    setSimulationOutputFormat(e.target.value as PlatformType);
                    handleClearSimulation();
                  }}
                >
                  {availablePlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </FormatDropdown>
              )}
            </HeaderInner>
            <ModeToggle>
              <ModeButton
                $active={mode === "visualizer"}
                onClick={() => setMode("visualizer")}
              >
                Visualizer
              </ModeButton>
              <ModeButton
                $active={mode === "simulation"}
                onClick={() => setMode("simulation")}
              >
                Simulation
              </ModeButton>
            </ModeToggle>
          </HeaderContent>
        </Header>
        <MainContent>
          {mode === "visualizer" ? (
            <>
              <Panel $width={leftPanelWidth}>
                <JsonEditor
                  value={outputFormat === "pega" ? jsonValue : transformedJson}
                  onChange={outputFormat === "pega" ? handleJsonChange : undefined}
                  schema={outputFormat === "pega" ? conversationSchema : undefined}
                  currentSample={currentSample}
                  onSampleLoad={handleSampleLoad}
                  readOnly={outputFormat !== "pega"}
                  title="Sample"
                  samples={samplesByFormat[outputFormat] || []}
                  outputFormat={outputFormat}
                />
              </Panel>
              <ResizeHandle onMouseDown={handleLeftResizeStart} />
              <RightPanel>
                <ChatPanel $width={chatPanelWidth}>
                  {outputFormat === "pega" ? (
                    <ChatRenderer
                      messages={conversation?.messages || []}
                      onMessageClick={setSelectedMessage}
                    />
                  ) : outputFormat === "json-render" ? (
                    <JsonRenderPreview jsonString={transformedJson} />
                  ) : outputFormat === "google-a2ui" ? (
                    <A2UIPreview jsonString={transformedJson} />
                  ) : outputFormat === "adaptive-cards" ? (
                    <AdaptiveCardsPreview jsonString={transformedJson} />
                  ) : (
                    <PreviewPlaceholder>
                      <PlaceholderIcon>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                      </PlaceholderIcon>
                      <PlaceholderTitle>Format Preview</PlaceholderTitle>
                      <PlaceholderDescription>
                        Native rendering for this format is not yet implemented. 
                        View the JSON structure in the editor panel to see the transformed output.
                      </PlaceholderDescription>
                    </PreviewPlaceholder>
                  )}
                </ChatPanel>
                {selectedMessage?.case && outputFormat === "pega" ? (
                  <>
                    <ResizeHandle onMouseDown={handleRightResizeStart} />
                    <DetailPanel>
                      <CaseDetailView case={selectedMessage.case} />
                    </DetailPanel>
                  </>
                ) : (
                  <ResizeHandle onMouseDown={handleRightResizeStart} />
                )}
              </RightPanel>
            </>
          ) : (
            <SimulationContainer>
              <SimulationChatView
                messages={simulationMessages}
                isLoading={isSimulating}
                streamingText={streamingText}
                onSendMessage={handleSimulationSend}
                models={availableModels}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                ttsEnabled={ttsEnabled}
                onTtsToggle={setTtsEnabled}
                outputFormat={simulationOutputFormat}
                onClearChat={handleClearSimulation}
              />
            </SimulationContainer>
          )}
        </MainContent>
      </PageContainer>
    </Providers>
  );
}
