
import type { ChatMessage, MessagePart } from "@/lib/types"
import styled, { css } from "styled-components"
import { useState, useEffect, useRef } from "react"
import { CodeBlock } from "@/components/code-block"
import { ImagePart } from "@/components/image-part"
import { InsightCard } from "@/components/insight-card"
import { ViewPart } from "@/components/view-part"
import { CasePart } from "@/components/case-part"
import { ActionButtons } from "@/components/action-buttons"
import { Flex, Icon, Card, CardContent } from "@pega/cosmos-react-core"
import { RichTextViewer } from "@pega/cosmos-react-rte"

interface ChatRendererProps {
  messages: ChatMessage[]
  onMessageClick?: (message: ChatMessage) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #EAECF6;
`

const Header = styled.div`
  border-bottom: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 16px;
`

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
`

const MessagesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 24px;
`

const CaseMessageContainer = styled.div`
  width: 100%;
  margin-left: -24px;
  margin-right: -24px;
  padding: 0 24px;
`

const PartContainer = styled.div<{ isUser: boolean; hasCase?: boolean; $isSingleLine?: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  align-items: ${props => props.$isSingleLine ? 'center' : 'flex-start'};
  gap: 0.5rem;
  margin-bottom: ${props => props.hasCase ? '12px' : '0'};
  
  &:last-child {
    margin-bottom: 0;
  }
`

const PartContentWrapper = styled.div<{ isUser: boolean; hasCase?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  width: 100%;
`

export const StyledPolarisIcon = styled(Flex)(({ theme }) => {
  return css`
    border-radius: 50%;
    color: ${theme.base.palette.light};
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
  border: 2px solid #3F57E4;
  border-radius: 0;
  background: #fff;
`

const CaseCardContent = styled(CardContent)`
  gap: 12px;
`

const PartBase = styled.div<{ isUser: boolean; $hasCase?: boolean }>`
  border-radius: ${props => props.isUser ? '20px 5px 20px 20px' : '0'};
  ${props => props.isUser && `
    display: flex;
    padding: 6px 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    background: #3F57E4;
    color: white;
  `}
`

const TextPart = styled(PartBase)<{ $hasActions?: boolean }>`
  ${props => !props.isUser && !props.$hasCase && `
    padding: 10px 16px;
  `}
  ${props => props.$hasActions && !props.isUser && `
    border: 1px solid #3F57E4;
  `}
`

const TextContent = styled.p`
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`

const MarkdownPart = styled.div<{ $hasCase?: boolean }>`
  border-radius: 0;
  background: transparent;
  padding: ${props => props.$hasCase ? '0' : '16px'};
  max-width: 100%;
  & > div > div {
    padding: 0;
  }
`

const RichTextPart = styled(PartBase)`
  ${props => !props.isUser && `
    padding: 10px 16px;
  `}
`

export function ChatRenderer({ messages, onMessageClick }: ChatRendererProps) {
  return (
    <Container>
      <Header>
        <Title>Chat Preview</Title>
      </Header>

      <MessagesContainer>
        {messages.map((message, idx) => (
          <MessageBubble 
            key={idx} 
            message={message} 
            onClick={() => onMessageClick?.(message)}
          />
        ))}
      </MessagesContainer>
    </Container>
  )
}

function MessageBubble({ message, onClick }: { message: ChatMessage; onClick?: () => void }) {
  const hasCase = !!message.case

  // Render parts with their individual roles
  const renderParts = () => {
    return message.parts.map((part) => {
      const partRole = part.role || "assistant"
      const isPartUser = partRole === "user"
      
      // Skip rendering icon/container for case parts - they handle their own rendering
      if (part.type === "case") {
        return <PartRenderer key={part.id} part={part} message={message} />
      }

      return (
        <PartContainerWithAlignment 
          key={part.id} 
          part={part}
          isUser={isPartUser} 
          hasCase={hasCase}
        >
          {({ isSingleLine }) => (
            <>
              {!isPartUser && (
                <StyledPolarisIcon
                  container={{
                    inline: true,
                    alignItems: "center",
                    justify: "center",
                  }}
                  style={{
                    alignSelf: isSingleLine ? 'center' : 'flex-start',
                    marginTop: isSingleLine ? '0' : '0'
                  }}
                >
                  <Icon name="polaris-solid" size="m" />
                </StyledPolarisIcon>
              )}
              <PartContentWrapper isUser={isPartUser} hasCase={hasCase}>
                <PartRenderer part={part} message={message} />
              </PartContentWrapper>
            </>
          )}
        </PartContainerWithAlignment>
      )
    })
  }

  const content = (
    <>
      {renderParts()}
    </>
  )

  if (hasCase) {
    return (
      <CaseMessageContainer>
        <CaseCardWrapper onClick={onClick}>
          <CaseCardContent>
            {content}
          </CaseCardContent>
        </CaseCardWrapper>
      </CaseMessageContainer>
    )
  }

  return <>{content}</>
}

function PartContainerWithAlignment({ 
  part, 
  isUser, 
  hasCase, 
  children 
}: { 
  part: MessagePart
  isUser: boolean
  hasCase: boolean
  children: (props: { isSingleLine: boolean }) => React.ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isSingleLine, setIsSingleLine] = useState(false)

  useEffect(() => {
    const checkSingleLine = () => {
      if (!contentRef.current) return
      
      // Only check for text and markdown parts
      if (part.type !== "text" && part.type !== "markdown") {
        setIsSingleLine(false)
        return
      }

      // For text parts, look for the p element (could be nested in PartWithActionsWrapper)
      // For markdown parts, look for the rendered content
      const textElement = contentRef.current.querySelector('p') || 
                         contentRef.current.querySelector('[class*="RichTextViewer"]') ||
                         contentRef.current.querySelector('[class*="RichText"]')
      
      if (!textElement) {
        setIsSingleLine(false)
        return
      }

      // Check if text is single line by comparing scrollHeight to line height
      const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight) || 
                         parseFloat(getComputedStyle(textElement).fontSize) * 1.6
      const scrollHeight = textElement.scrollHeight
      
      // Allow small tolerance for rounding - single line if scrollHeight is less than 1.5x line height
      setIsSingleLine(scrollHeight <= lineHeight * 1.5)
    }

    // Use requestAnimationFrame to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(checkSingleLine)
    }, 0)
    
    // Recheck on window resize and when actions might change
    window.addEventListener('resize', checkSingleLine)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkSingleLine)
    }
  }, [part])

  return (
    <PartContainer 
      ref={contentRef}
      isUser={isUser} 
      hasCase={hasCase} 
      $isSingleLine={isSingleLine}
    >
      {children({ isSingleLine })}
    </PartContainer>
  )
}

const PartWithActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

function PartRenderer({ part, message }: { part: MessagePart; message: ChatMessage }) {
  const partRole = part.role || "assistant"
  const isUser = partRole === "user"
  const hasCase = !!message.case
  const hasActions = part.actions && part.actions.length > 0
  
  const renderPartContent = () => {
    switch (part.type) {
      case "text":
        return (
          <TextPart isUser={isUser} $hasCase={hasCase} $hasActions={hasActions}>
            <TextContent>{part.content}</TextContent>
          </TextPart>
        )

      case "markdown":
        return (
          <MarkdownPart $hasCase={hasCase}>
            <RichTextViewer content={part.content} type="markdown" />
          </MarkdownPart>
        )

      case "richText":
        return (
          <RichTextPart 
            isUser={isUser}
            dangerouslySetInnerHTML={{ __html: part.content }} 
          />
        )

      case "code":
        return <CodeBlock part={part} />

      case "image":
        return <ImagePart part={part} />

      case "insight":
        return <InsightCard part={part} />

      case "view":
        return <ViewPart part={part} />

      case "case":
        return <CasePart part={part} message={message} />

      default:
        return null
    }
  }

  if (hasActions) {
    return (
      <PartWithActionsWrapper>
        {renderPartContent()}
        <ActionButtons actions={part.actions!} />
      </PartWithActionsWrapper>
    )
  }

  return renderPartContent()
}
