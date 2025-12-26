import { useState, useEffect } from "react"
import styled from "styled-components"
import { JsonEditor } from "@/components/json-editor"
import { ChatRenderer } from "@/components/chat-renderer"
import { exampleConversation } from "@/lib/example-messages"
import conversationSchema from "@/lib/schemas/chat-message.schema.json"
import type { Conversation } from "@/lib/types"
import { MessageSquare, Code2 } from "lucide-react"
import { Providers } from "@/components/providers"

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
`

const Header = styled.header`
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
`

const HeaderContent = styled.div`
  display: flex;
  height: 56px;
  align-items: center;
  padding: 0 24px;
`

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const IconContainer = styled.div`
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #3F57E4;
`

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`

const Subtitle = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const Panel = styled.div`
  width: 50%;
  border-right: 1px solid #e5e7eb;
`

const RightPanel = styled.div`
  width: 50%;
`

const Footer = styled.footer`
  border-top: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 24px;
`

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
`

const FooterRight = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`

function App() {
  const [jsonValue, setJsonValue] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    // Initialize with example conversation
    const initialJson = JSON.stringify(exampleConversation, null, 2)
    setJsonValue(initialJson)
    setConversation(exampleConversation)
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonValue(value)

    // Try to parse and update conversation
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && parsed.messages) {
        setConversation(parsed)
      }
    } catch {
      // Invalid JSON, keep previous conversation
    }
  }

  return (
    <Providers>
      <PageContainer>
        <Header>
          <HeaderContent>
            <HeaderInner>
              <IconContainer>
                <MessageSquare size={16} color="white" />
              </IconContainer>
              <div>
                <Title>AI Chat Message Visualizer</Title>
                <Subtitle>Adaptive UI rendering from JSON schema</Subtitle>
              </div>
            </HeaderInner>
          </HeaderContent>
        </Header>

        <MainContent>
          <Panel>
            <JsonEditor value={jsonValue} onChange={handleJsonChange} schema={conversationSchema} />
          </Panel>

          <RightPanel>
            <ChatRenderer messages={conversation?.messages || []} />
          </RightPanel>
        </MainContent>

        <Footer>
          <FooterContent>
            <span>Schema Version: 1.0.0</span>
            <FooterRight>
              <Code2 size={14} />
              {conversation?.messages.length || 0} message{(conversation?.messages.length || 0) !== 1 ? "s" : ""} loaded
            </FooterRight>
          </FooterContent>
        </Footer>
      </PageContainer>
    </Providers>
  )
}

export default App

