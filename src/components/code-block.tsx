
import type { CodePart } from "@/lib/types"
import styled from "styled-components"
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"

interface CodeBlockProps {
  part: CodePart
}

const Card = styled.div`
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Badge = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
`

const Filename = styled.span`
  font-size: 12px;
  color: #6b7280;
`

const StatusContainer = styled.div<{ status?: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => {
    switch (props.status) {
      case 'queued': return '#d97706'
      case 'running': return '#2563eb'
      case 'success': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }};
`

const CodeContent = styled.pre`
  overflow-x: auto;
  background: #fff;
  padding: 16px;
  margin: 0;
`

const Code = styled.code`
  font-size: 14px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`

const Output = styled.div<{ type?: string }>`
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  font-size: 12px;
  background: ${props => props.type === "error" ? "#fef2f2" : "rgba(0, 0, 0, 0.02)"};
  color: ${props => props.type === "error" ? "#ef4444" : "inherit"};
`

const OutputLabel = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`

const OutputContent = styled.pre`
  margin: 4px 0 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`

export function CodeBlock({ part }: CodeBlockProps) {
  const statusIcons = {
    queued: Clock,
    running: Loader2,
    success: CheckCircle2,
    error: XCircle,
    idle: null,
  }

  const StatusIcon = part.status ? statusIcons[part.status] : null

  return (
    <Card>
      <Header>
        <HeaderLeft>
          <Badge>{part.language}</Badge>
          {part.filename && <Filename>{part.filename}</Filename>}
        </HeaderLeft>
        {part.status && StatusIcon && (
          <StatusContainer status={part.status}>
            <StatusIcon size={14} style={part.status === "running" ? { animation: 'spin 1s linear infinite' } : undefined} />
            {part.status}
          </StatusContainer>
        )}
      </Header>

      <CodeContent>
        <Code>{part.content}</Code>
      </CodeContent>

      {part.output && (
        <Output type={part.output.type}>
          <OutputLabel>Output:</OutputLabel>
          <OutputContent>{part.output.data}</OutputContent>
        </Output>
      )}
    </Card>
  )
}
