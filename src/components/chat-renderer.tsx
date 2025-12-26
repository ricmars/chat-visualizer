
import type { ChatMessage, MessagePart } from "@/lib/types"
import styled from "styled-components"
import { CodeBlock } from "@/components/code-block"
import { ImagePart } from "@/components/image-part"
import { InsightCard } from "@/components/insight-card"
import { ViewPart } from "@/components/view-part"
import { ActionButtons } from "@/components/action-buttons"
import ReactMarkdown from "react-markdown"

interface ChatRendererProps {
  messages: ChatMessage[]
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

const MessageBubbleContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`

const MessageContent = styled.div<{ isUser: boolean }>`
  max-width: 85%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`

const PartBase = styled.div<{ isUser: boolean }>`
  border-radius: ${props => props.isUser ? '20px 5px 20px 20px' : '8px'};
  ${props => !props.isUser && `
    background: rgba(0, 0, 0, 0.05);
  `}
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

const TextPart = styled(PartBase)`
  ${props => !props.isUser && `
    padding: 10px 16px;
  `}
`

const TextContent = styled.p`
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`

const MarkdownPart = styled.div`
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 16px;
  max-width: 100%;
`

const RichTextPart = styled(PartBase)`
  ${props => !props.isUser && `
    padding: 10px 16px;
  `}
`

export function ChatRenderer({ messages }: ChatRendererProps) {
  return (
    <Container>
      <Header>
        <Title>Chat Preview</Title>
      </Header>

      <MessagesContainer>
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}
      </MessagesContainer>
    </Container>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <MessageBubbleContainer isUser={isUser}>
      <MessageContent isUser={isUser}>
        {message.parts.map((part) => (
          <PartRenderer key={part.id} part={part} isUser={isUser} />
        ))}

        {message.actions && message.actions.length > 0 && <ActionButtons actions={message.actions} />}
      </MessageContent>
    </MessageBubbleContainer>
  )
}

function PartRenderer({ part, isUser }: { part: MessagePart; isUser: boolean }) {
  switch (part.type) {
    case "text":
      return (
        <TextPart isUser={isUser}>
          <TextContent>{part.content}</TextContent>
        </TextPart>
      )

    case "markdown":
      return (
        <MarkdownPart>
          <ReactMarkdown>{part.content}</ReactMarkdown>
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

    default:
      return null
  }
}
