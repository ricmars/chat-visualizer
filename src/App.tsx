import { useState, useEffect, useRef, useCallback } from "react"
import styled from "styled-components"
import { JsonEditor } from "@/components/json-editor"
import { ChatRenderer } from "@/components/chat-renderer"
import { CaseDetailView } from "@/components/case-detail-view"
import conversationSchema from "@/lib/schemas/chat-message.schema.json"
import type { Conversation, ChatMessage } from "@/lib/types"
import { MessageSquare } from "lucide-react"
import { Providers } from "@/components/providers"
import { registerIcon } from "@pega/cosmos-react-core";
import * as polarisSolidIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/polaris-solid.icon";
import * as userSolidIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/user-solid.icon";

registerIcon(polarisSolidIcon, userSolidIcon);

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

const Panel = styled.div<{ width: number }>`
  width: ${props => props.width}px;
  min-width: 300px;
  max-width: 80%;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
`

const ChatPanel = styled.div<{ width: number }>`
  width: ${props => props.width}px;
  min-width: 300px;
  max-width: 80%;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
`

const DetailPanel = styled.div`
  flex: 1;
  min-width: 0;
  margin: 1rem;
`

const ResizeHandle = styled.div`
  width: 4px;
  background: #e5e7eb;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  &:hover {
    background: #3F57E4;
  }

  &::after {
    content: '';
    position: absolute;
    left: -2px;
    right: -2px;
    top: 0;
    bottom: 0;
  }
`

function App() {
  const [jsonValue, setJsonValue] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [currentSample, setCurrentSample] = useState<string>("sample3.json")
  
  // Panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(600)
  const [chatPanelWidth, setChatPanelWidth] = useState(650)
  
  // Resize state
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartLeftWidth = useRef(0)
  const resizeStartChatWidth = useRef(0)

  useEffect(() => {
    // Initialize with sample3.json
    const loadSample3 = async () => {
      try {
        const response = await fetch("/sample3.json")
        if (!response.ok) {
          throw new Error("Failed to load sample3.json")
        }
        const json = await response.json()
        const initialJson = JSON.stringify(json, null, 2)
        setJsonValue(initialJson)
        setConversation(json)
        setCurrentSample("sample3.json")
      } catch (error) {
        console.error("Error loading sample3.json:", error)
      }
    }
    loadSample3()
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonValue(value)

    // Try to parse and update conversation
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && parsed.messages) {
        setConversation(parsed)
        // Reset selected message when conversation changes
        setSelectedMessage(null)
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
    setSelectedMessage(null) // Reset selected message when switching samples
  }

  // Left panel resize handlers (between JsonEditor and ChatPanel)
  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingLeft(true)
    resizeStartX.current = e.clientX
    resizeStartLeftWidth.current = leftPanelWidth
  }, [leftPanelWidth])

  // Right panel resize handlers (between ChatPanel and DetailPanel)
  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingRight(true)
    resizeStartX.current = e.clientX
    resizeStartChatWidth.current = chatPanelWidth
  }, [chatPanelWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const deltaX = e.clientX - resizeStartX.current
        const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, resizeStartLeftWidth.current + deltaX))
        setLeftPanelWidth(newWidth)
      } else if (isResizingRight) {
        const deltaX = e.clientX - resizeStartX.current
        const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, resizeStartChatWidth.current + deltaX))
        setChatPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingLeft, isResizingRight])

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
          <Panel width={leftPanelWidth}>
            <JsonEditor 
              value={jsonValue} 
              onChange={handleJsonChange} 
              schema={conversationSchema}
              currentSample={currentSample}
              onSampleLoad={handleSampleLoad}
            />
          </Panel>
          <ResizeHandle onMouseDown={handleLeftResizeStart} />
          <RightPanel>
            <ChatPanel width={chatPanelWidth}>
              <ChatRenderer 
                messages={conversation?.messages || []} 
                onMessageClick={setSelectedMessage}
              />
            </ChatPanel>
            {selectedMessage?.case ? (
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
        </MainContent>
      </PageContainer>
    </Providers>
  )
}

export default App

