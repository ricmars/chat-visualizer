import { useState, useEffect } from "react"
import styled from "styled-components"
import { JsonEditor } from "@/components/json-editor"
import { ChatRenderer } from "@/components/chat-renderer"
import { CaseDetailView } from "@/components/case-detail-view"
import conversationSchema from "@/lib/schemas/chat-message.schema.json"
import type { Conversation, ChatMessage } from "@/lib/types"
import { MessageSquare } from "lucide-react"
import { Providers } from "@/components/providers"

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: rgb(234, 236, 246);
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

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const Panel = styled.div`
  width: 800px;
  border-right: 1px solid #e5e7eb;
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`

const ChatPanel = styled.div`
  width: 900px;
  border-right: 1px solid #e5e7eb;
`

const DetailPanel = styled.div`
  flex: 1;
  min-width: 0;
  margin: 1rem;
`

function App() {
  const [jsonValue, setJsonValue] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [currentSample, setCurrentSample] = useState<string>("sample1.json")

  useEffect(() => {
    // Initialize with sample1.json
    const loadSample1 = async () => {
      try {
        const response = await fetch("/sample1.json")
        if (!response.ok) {
          throw new Error("Failed to load sample1.json")
        }
        const json = await response.json()
        const initialJson = JSON.stringify(json, null, 2)
        setJsonValue(initialJson)
        setConversation(json)
        setCurrentSample("sample1.json")
      } catch (error) {
        console.error("Error loading sample1.json:", error)
      }
    }
    loadSample1()
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonValue(value)

    // Try to parse and update conversation
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && parsed.messages) {
        setConversation(parsed)
        // If the JSON doesn't match any sample, clear current sample
        // We can't easily detect this, so we'll only clear if user manually edits
        // The sample will be set when loading from dropdown
      }
    } catch {
      // Invalid JSON, keep previous conversation
    }
  }

  const handleSampleLoad = (sampleName: string) => {
    setCurrentSample(sampleName)
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
              </div>
            </HeaderInner>
          </HeaderContent>
        </Header>
        <MainContent>
          <Panel>
            <JsonEditor 
              value={jsonValue} 
              onChange={handleJsonChange} 
              schema={conversationSchema}
              currentSample={currentSample}
              onSampleLoad={handleSampleLoad}
            />
          </Panel>
          <RightPanel>
            <ChatPanel>
              <ChatRenderer 
                messages={conversation?.messages || []} 
                onMessageClick={setSelectedMessage}
              />
            </ChatPanel>
            {selectedMessage && (
              <DetailPanel>
                <CaseDetailView />
              </DetailPanel>
            )}
          </RightPanel>
        </MainContent>
      </PageContainer>
    </Providers>
  )
}

export default App

