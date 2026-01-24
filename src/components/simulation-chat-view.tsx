"use client";

import styled from "styled-components";
import { useRef, useEffect, useState } from "react";
import type { ChatMessage, MessagePart } from "@/lib/types";
import type { PlatformType } from "@/lib/transformers/types";
import { MessageInput, type AttachedFile } from "./message-input";
import { CodeBlock } from "@/components/code-block";
import { ImagePart as ImagePartComponent } from "@/components/image-part";
import { InsightCard } from "@/components/insight-card";
import { ViewPart } from "@/components/view-part";
import { CasePart } from "@/components/case-part";
import { ActionButtons } from "@/components/action-buttons";
import { JsonRenderPreview } from "@/components/json-render-preview";
import { A2UIPreview } from "@/components/a2ui-preview";
import { AdaptiveCardsPreview } from "@/components/adaptive-cards-preview";
import { Flex, Icon, Card, CardContent, Progress } from "@pega/cosmos-react-core";
import { RichTextViewer } from "@pega/cosmos-react-rte";
import { css } from "styled-components";

// Type for format-native messages
export interface FormatNativeMessage {
  type: "format_native";
  platform: PlatformType;
  content: unknown; // The raw format output (A2UI doc, json-render tree, or Adaptive Card)
  timestamp?: string;
}

// Union type for all message types in simulation
export type SimulationMessage = ChatMessage | FormatNativeMessage;

interface SimulationChatViewProps {
  messages: SimulationMessage[];
  isLoading?: boolean;
  streamingText?: string;
  onSendMessage: (message: string, attachments: AttachedFile[]) => void;
  models?: { id: string; name: string }[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  ttsEnabled?: boolean;
  onTtsToggle?: (enabled: boolean) => void;
  outputFormat?: PlatformType;
  onClearChat?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #eaecf6;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
`;

const MenuContainer = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const MenuDropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 160px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  opacity: ${props => props.$open ? 1 : 0};
  visibility: ${props => props.$open ? 'visible' : 'hidden'};
  transform: ${props => props.$open ? 'translateY(0)' : 'translateY(-4px)'};
  transition: all 0.15s ease;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;

  &:first-child {
    border-radius: 7px 7px 0 0;
  }

  &:last-child {
    border-radius: 0 0 7px 7px;
  }

  &:only-child {
    border-radius: 7px;
  }

  &:hover {
    background: #f3f4f6;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 24px;
  gap: 24px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3f57e4 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  svg {
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const EmptyStateTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
`;

const EmptyStateDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
`;

const SuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 32px;
  max-width: 600px;
`;

const SuggestionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3f57e4;
    box-shadow: 0 4px 12px rgba(63, 87, 228, 0.1);
  }
`;

const SuggestionTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
`;

const SuggestionDescription = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const InputSection = styled.div`
  background: #fff;
`;

// User message bubble
const UserMessageBubble = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const UserMessageContent = styled.div`
  max-width: 70%;
  padding: 12px 18px;
  background: #3f57e4;
  color: #fff;
  border-radius: 20px 5px 20px 20px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

// Assistant message container
const AssistantMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

// Streaming indicator
const StreamingContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
`;

const StreamingContent = styled.div`
  flex: 1;
  padding: 12px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 12px;
  color: #6b7280;
  font-size: 14px;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Styled components from chat-renderer
const CaseMessageContainer = styled.div`
  width: 100%;
  margin-left: -24px;
  margin-right: -24px;
  padding: 0 24px;
`;

const PartContainer = styled.div<{ $isUser: boolean; $hasCase?: boolean; $isSingleLine?: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  align-items: ${props => props.$isSingleLine ? 'center' : 'flex-start'};
  gap: 0.5rem;
  margin-bottom: ${props => props.$hasCase ? '12px' : '0'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PartContentWrapper = styled.div<{ $isUser: boolean; $hasCase?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

export const StyledPolarisIcon = styled(Flex).withConfig({
  shouldForwardProp: (prop) => !['container', 'interactive'].includes(prop),
})(({ theme }) => {
  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: ${theme?.base?.palette?.light || '#ffffff'};
    background: #681fc3;
    width: 32px;
    height: 32px;
    margin-inline-end: 0.5rem;
    flex-shrink: 0;
    & > svg {
      height: 20px;
      width: 20px;
    }
  `;
});

const CaseCardWrapper = styled(Card)`
  width: 100%;
  border: 2px solid #3f57e4;
  border-radius: 0;
  background: #fff;
`;

const CaseCardContent = styled(CardContent)`
  gap: 12px;
`;

const PartBase = styled.div<{ $isUser: boolean; $hasCase?: boolean }>`
  border-radius: ${props => props.$isUser ? '20px 5px 20px 20px' : '0'};
  ${props => props.$isUser && `
    display: flex;
    padding: 6px 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    background: #3F57E4;
    color: white;
  `}
`;

const TextPart = styled(PartBase)<{ $hasActions?: boolean }>`
  ${props => !props.$isUser && !props.$hasCase && `
    padding: 10px 16px;
  `}
`;

const TextContent = styled.p`
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`;

const MarkdownPart = styled.div<{ $hasCase?: boolean }>`
  border-radius: 0;
  background: transparent;
  padding: ${props => props.$hasCase ? '0' : '16px'};
  max-width: 100%;
  & > div > div {
    padding: 0;
  }
`;

const RichTextPart = styled(PartBase)`
  ${props => !props.$isUser && `
    padding: 10px 16px;
  `}
`;

const PartWithActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SUGGESTIONS = [
  {
    title: "Create a marketing campaign",
    description: "For a new product launch",
  },
  {
    title: "Plan social media content",
    description: "Multi-channel strategy",
  },
  {
    title: "Design email sequence",
    description: "Nurture leads effectively",
  },
  {
    title: "Analyze campaign metrics",
    description: "Track performance & ROI",
  },
];

export function SimulationChatView({
  messages,
  isLoading = false,
  streamingText = "",
  onSendMessage,
  models,
  selectedModel,
  onModelChange,
  ttsEnabled,
  onTtsToggle,
  outputFormat = "pega",
  onClearChat,
}: SimulationChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleSuggestionClick = (suggestion: typeof SUGGESTIONS[0]) => {
    onSendMessage(`I want to ${suggestion.title.toLowerCase()}`, []);
  };

  const handleClearChat = () => {
    setMenuOpen(false);
    onClearChat?.();
  };

  const isEmpty = messages.length === 0 && !isLoading && !streamingText;

  return (
    <Container>
      <ChatHeader>
        <MenuContainer ref={menuRef}>
          <MenuButton onClick={() => setMenuOpen(!menuOpen)} aria-label="Chat options">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </MenuButton>
          <MenuDropdown $open={menuOpen}>
            <MenuItem onClick={handleClearChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear Chat
            </MenuItem>
          </MenuDropdown>
        </MenuContainer>
      </ChatHeader>
      <MessagesArea>
        {isEmpty ? (
          <EmptyState>
            <EmptyStateIcon>
              <Icon name="polaris-solid" />
            </EmptyStateIcon>
            <EmptyStateTitle>How can I help you today?</EmptyStateTitle>
            <EmptyStateDescription>
              Start a conversation to create marketing campaigns, manage workflows,
              and visualize data. Try one of the suggestions below.
            </EmptyStateDescription>
            <SuggestionsGrid>
              {SUGGESTIONS.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <SuggestionTitle>{suggestion.title}</SuggestionTitle>
                  <SuggestionDescription>{suggestion.description}</SuggestionDescription>
                </SuggestionCard>
              ))}
            </SuggestionsGrid>
          </EmptyState>
        ) : (
          <>
            {messages.map((message, idx) => (
              <SimulationMessageRenderer 
                key={idx} 
                message={message} 
                outputFormat={outputFormat}
              />
            ))}
            
            {/* Streaming text display */}
            {streamingText && (
              <StreamingContainer>
                <StyledPolarisIcon>
                  <Icon name="polaris-solid" size="m" />
                </StyledPolarisIcon>
                <StreamingContent>{streamingText}</StreamingContent>
              </StreamingContainer>
            )}
            
            {/* Loading indicator */}
            {isLoading && !streamingText && (
              <LoadingIndicator>
                <Progress variant="ring" placement="inline" message="Thinking..." />
              </LoadingIndicator>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </MessagesArea>
      
      <InputSection>
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={isLoading}
          placeholder="Type your message..."
          models={models}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          ttsEnabled={ttsEnabled}
          onTtsToggle={onTtsToggle}
        />
      </InputSection>
    </Container>
  );
}

// Styled components for format-native message preview
const FormatPreviewWrapper = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FormatPreviewContent = styled.div`
  max-height: 600px;
  overflow-y: auto;
  
  /* Reset styles from preview components */
  & > div {
    height: auto !important;
    min-height: 0 !important;
  }
`;

// Render a simulation message (all formats are now format_native)
function SimulationMessageRenderer({ 
  message, 
  outputFormat: _outputFormat 
}: { 
  message: SimulationMessage; 
  outputFormat: PlatformType;
}) {
  // All assistant messages should now be format_native
  if (message.type === "format_native") {
    const formatMessage = message as FormatNativeMessage;
    
    // Pega format: content is a ChatMessage, render with MessageRenderer
    if (formatMessage.platform === "pega") {
      return <MessageRenderer message={formatMessage.content as ChatMessage} />;
    }
    
    // Other formats: render with their preview components
    const jsonString = JSON.stringify(formatMessage.content, null, 2);
    
    // Wrap the content for the preview components
    const wrappedContent = formatMessage.platform === "adaptive-cards" 
      ? JSON.stringify({ cards: [formatMessage.content] }, null, 2)
      : jsonString;
    
    return (
      <AssistantMessageContainer>
        <PartContainer $isUser={false} $hasCase={false}>
          <StyledPolarisIcon style={{ alignSelf: 'flex-start' }}>
            <Icon name="polaris-solid" size="m" />
          </StyledPolarisIcon>
          <PartContentWrapper $isUser={false} $hasCase={false}>
            <FormatPreviewWrapper>
              <FormatPreviewContent>
                {formatMessage.platform === "json-render" && (
                  <JsonRenderPreview jsonString={wrappedContent} />
                )}
                {formatMessage.platform === "google-a2ui" && (
                  <A2UIPreview jsonString={wrappedContent} />
                )}
                {formatMessage.platform === "adaptive-cards" && (
                  <AdaptiveCardsPreview jsonString={wrappedContent} />
                )}
              </FormatPreviewContent>
            </FormatPreviewWrapper>
          </PartContentWrapper>
        </PartContainer>
      </AssistantMessageContainer>
    );
  }
  
  // Legacy fallback: direct ChatMessage (shouldn't happen with new code)
  return <MessageRenderer message={message as ChatMessage} />;
}

// Render a single message (which may contain multiple parts)
function MessageRenderer({ message }: { message: ChatMessage }) {
  const hasCase = !!message.case;
  
  // Check if this is a simple user message (single text part with user role)
  const isSimpleUserMessage = 
    message.parts.length === 1 && 
    message.parts[0].type === "text" && 
    message.parts[0].role === "user";
    
  if (isSimpleUserMessage) {
    return (
      <UserMessageBubble>
        <UserMessageContent>
          {(message.parts[0] as { content: string }).content}
        </UserMessageContent>
      </UserMessageBubble>
    );
  }

  // Render parts with their individual roles
  const renderParts = () => {
    return message.parts.map((part) => {
      const partRole = part.role || "assistant";
      const isPartUser = partRole === "user";
      
      // Skip rendering icon/container for case parts - they handle their own rendering
      if (part.type === "case") {
        return <PartRenderer key={part.id} part={part} message={message} />;
      }

      return (
        <PartContainer 
          key={part.id} 
          $isUser={isPartUser} 
          $hasCase={hasCase}
        >
          {!isPartUser && (
            <StyledPolarisIcon style={{ alignSelf: 'flex-start' }}>
              <Icon name="polaris-solid" size="m" />
            </StyledPolarisIcon>
          )}
          <PartContentWrapper $isUser={isPartUser} $hasCase={hasCase}>
            <PartRenderer part={part} message={message} />
          </PartContentWrapper>
        </PartContainer>
      );
    });
  };

  const content = <>{renderParts()}</>;

  if (hasCase) {
    return (
      <CaseMessageContainer>
        <CaseCardWrapper>
          <CaseCardContent>
            {content}
          </CaseCardContent>
        </CaseCardWrapper>
      </CaseMessageContainer>
    );
  }

  return <AssistantMessageContainer>{content}</AssistantMessageContainer>;
}

function PartRenderer({ part, message }: { part: MessagePart; message: ChatMessage }) {
  const partRole = part.role || "assistant";
  const isUser = partRole === "user";
  const hasCase = !!message.case;
  const hasActions = part.actions && part.actions.length > 0;
  
  const renderPartContent = () => {
    switch (part.type) {
      case "text":
        return (
          <TextPart $isUser={isUser} $hasCase={hasCase} $hasActions={hasActions}>
            <TextContent>{part.content}</TextContent>
          </TextPart>
        );

      case "markdown":
        return (
          <MarkdownPart $hasCase={hasCase}>
            <RichTextViewer content={part.content} type="markdown" />
          </MarkdownPart>
        );

      case "richText":
        return (
          <RichTextPart 
            $isUser={isUser}
            dangerouslySetInnerHTML={{ __html: part.content }} 
          />
        );

      case "code":
        return <CodeBlock part={part} />;

      case "image":
        return <ImagePartComponent part={part} />;

      case "insight":
        return <InsightCard part={part} />;

      case "view":
        return <ViewPart part={part} />;

      case "case":
        return <CasePart part={part} message={message} />;

      default:
        return null;
    }
  };

  if (hasActions) {
    return (
      <PartWithActionsWrapper>
        {renderPartContent()}
        <ActionButtons actions={part.actions!} />
      </PartWithActionsWrapper>
    );
  }

  return renderPartContent();
}
