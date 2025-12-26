
import { useState } from "react"
import styled from "styled-components"
import type { Action } from "@/lib/types"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface ActionButtonsProps {
  actions: Action[]
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ActionButton = styled.button<{ status?: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  border-radius: 20px 5px 20px 20px;
  border: 1px solid #3F57E4;
  background: #FFF;
  color: #3F57E4;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.status === "success" && `
    border-color: #10b981;
    color: #10b981;
  `}

  ${props => props.status === "failed" && `
    border-color: #ef4444;
    color: #ef4444;
  `}
`

export function ActionButtons({ actions }: ActionButtonsProps) {
  const [actionStates, setActionStates] = useState<Record<string, string>>(
    Object.fromEntries(actions.map((a) => [a.id, a.status || "idle"])),
  )

  const handleAction = (action: Action) => {
    console.log("[v0] Action triggered:", action.verb, action.payload)

    // Simulate action execution
    setActionStates((prev) => ({ ...prev, [action.id]: "running" }))

    setTimeout(() => {
      setActionStates((prev) => ({ ...prev, [action.id]: "success" }))
    }, 1500)
  }

  return (
    <Container>
      {actions.map((action) => {
        const status = actionStates[action.id]

        return (
          <ActionButton
            key={action.id}
            status={status}
            onClick={() => handleAction(action)}
            disabled={status === "running"}
          >
            {status === "running" && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {status === "success" && <CheckCircle2 size={14} />}
            {status === "failed" && <XCircle size={14} />}
            {action.title}
          </ActionButton>
        )
      })}
    </Container>
  )
}
