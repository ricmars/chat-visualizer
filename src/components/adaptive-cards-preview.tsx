"use client";

import styled from "styled-components";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as AdaptiveCards from "adaptivecards";

// ============================================================================
// TYPES
// ============================================================================

interface AdaptiveCardPayload {
  type: string;
  $schema?: string;
  version?: string;
  body?: unknown[];
  actions?: unknown[];
  [key: string]: unknown;
}

interface AdaptiveCardsDocument {
  id?: string;
  title?: string;
  platform?: string;
  cards: AdaptiveCardPayload[];
  warnings?: string[];
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
`;

const Header = styled.div`
  border-bottom: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 16px;
`;

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CardWrapper = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  /* Override default adaptive card styles for better integration */
  .ac-container {
    padding: 0 !important;
  }

  .ac-adaptiveCard {
    padding: 16px;
    background: white;
  }

  .ac-textBlock {
    font-family: inherit;
  }

  .ac-pushButton {
    font-family: inherit;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ac-pushButton.style-positive,
  .ac-pushButton[aria-pressed="true"] {
    background: #3f57e4;
    color: white;
    border: none;
  }

  .ac-pushButton.style-positive:hover,
  .ac-pushButton[aria-pressed="true"]:hover {
    background: #3348c7;
  }

  .ac-pushButton.style-default {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .ac-pushButton.style-default:hover {
    background: #f3f4f6;
  }

  /* Style for fact sets */
  .ac-factSet {
    margin: 8px 0;
  }

  .ac-fact-title {
    font-weight: 500;
    color: #6b7280;
    font-size: 13px;
  }

  .ac-fact-value {
    font-weight: 500;
    color: #111827;
  }

  /* Style for containers */
  .ac-container.style-accent {
    background: #eff6ff;
    border-left: 4px solid #3f57e4;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .ac-container.style-good {
    background: #f0fdf4;
    border-left: 4px solid #10b981;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .ac-container.style-warning {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .ac-container.style-attention {
    background: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  /* Image styling */
  .ac-image {
    border-radius: 8px;
    max-width: 100%;
  }

  /* Column styling */
  .ac-columnSet {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Code block styling (if supported) */
  .ac-codeBlock,
  pre {
    background: #1e1e1e;
    color: #e5e7eb;
    padding: 12px;
    border-radius: 6px;
    font-family: "Fira Code", "Monaco", "Menlo", monospace;
    font-size: 13px;
    overflow-x: auto;
  }

  /* Action container */
  .ac-actionSet {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  /* Input styling */
  .ac-input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .ac-input:focus {
    outline: none;
    border-color: #3f57e4;
    box-shadow: 0 0 0 2px rgba(63, 87, 228, 0.1);
  }
`;

const CardLabel = styled.div`
  background: #f3f4f6;
  padding: 8px 16px;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
`;

const ErrorContainer = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
`;

const CardContent = styled.div`
  padding: 16px;
`;

const ActionLogContainer = styled.div`
  margin-top: 24px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
`;

const ActionLogTitle = styled.strong`
  display: block;
  margin-bottom: 8px;
`;

const ActionLogEntry = styled.div`
  margin-top: 4px;
  color: #6b7280;
`;

const WarningsContainer = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
`;

// ============================================================================
// ADAPTIVE CARD RENDERER COMPONENT
// ============================================================================

interface CardRendererProps {
  payload: AdaptiveCardPayload;
  onAction: (action: Record<string, unknown>) => void;
}

function AdaptiveCardRenderer({ payload, onAction }: CardRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    try {
      // Create a new AdaptiveCard instance
      const adaptiveCard = new AdaptiveCards.AdaptiveCard();

      // Set up action handler
      adaptiveCard.onExecuteAction = (action: AdaptiveCards.Action) => {
        const actionData: Record<string, unknown> = {
          type: action.getJsonTypeName(),
          title: action.title,
        };

        if (action instanceof AdaptiveCards.SubmitAction) {
          actionData.data = action.data;
        } else if (action instanceof AdaptiveCards.OpenUrlAction) {
          actionData.url = action.url;
        }

        onAction(actionData);
      };

      // Parse the card payload
      adaptiveCard.parse(payload);

      // Render the card
      const renderedCard = adaptiveCard.render();
      if (renderedCard && containerRef.current) {
        containerRef.current.appendChild(renderedCard);
      }
    } catch (err) {
      console.error("Failed to render Adaptive Card:", err);
      setError(err instanceof Error ? err.message : "Failed to render card");
    }
  }, [payload, onAction]);

  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  return <CardContent ref={containerRef} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AdaptiveCardsPreviewProps {
  jsonString: string;
}

export function AdaptiveCardsPreview({ jsonString }: AdaptiveCardsPreviewProps) {
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Parse the document
  const document = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Handle different formats
      if (parsed.cards && Array.isArray(parsed.cards)) {
        return parsed as AdaptiveCardsDocument;
      }
      
      // If it's a single card
      if (parsed.type === "AdaptiveCard") {
        return {
          cards: [parsed as AdaptiveCardPayload],
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }, [jsonString]);

  // Action handler for card actions
  const handleAction = useCallback((action: Record<string, unknown>) => {
    const actionType = action.type as string || "unknown";
    const actionTitle = action.title as string;
    const actionData = action.data;
    const actionUrl = action.url as string;
    
    const logEntry = `Action: ${actionType}${actionTitle ? ` - "${actionTitle}"` : ""}${
      actionData ? ` (${JSON.stringify(actionData)})` : ""
    }${actionUrl ? ` URL: ${actionUrl}` : ""}`;
    
    setActionLog((prev) => [...prev.slice(-4), logEntry]);
    console.log("Adaptive Card action:", action);

    // Handle OpenUrl actions
    if (actionType === "Action.OpenUrl" && actionUrl) {
      window.open(actionUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  if (!document) {
    return (
      <PreviewContainer>
        <Header>
          <Title>Adaptive Cards Preview</Title>
        </Header>
        <ScrollContainer>
          <ErrorContainer>
            Invalid or empty Adaptive Cards document. Please check the JSON structure.
          </ErrorContainer>
        </ScrollContainer>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer>
      <Header>
        <Title>Adaptive Cards Preview</Title>
      </Header>
      <ScrollContainer>
        {document.warnings && document.warnings.length > 0 && (
          <WarningsContainer>
            <strong>Warnings:</strong>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              {document.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </WarningsContainer>
        )}
        
        <CardsContainer>
          {document.cards.map((card, index) => (
            <CardWrapper key={index}>
              {document.cards.length > 1 && (
                <CardLabel>Card {index + 1} of {document.cards.length}</CardLabel>
              )}
              <AdaptiveCardRenderer
                payload={card}
                onAction={handleAction}
              />
            </CardWrapper>
          ))}
        </CardsContainer>

        {actionLog.length > 0 && (
          <ActionLogContainer>
            <ActionLogTitle>Action Log:</ActionLogTitle>
            {actionLog.map((log, i) => (
              <ActionLogEntry key={i}>{log}</ActionLogEntry>
            ))}
          </ActionLogContainer>
        )}
      </ScrollContainer>
    </PreviewContainer>
  );
}
