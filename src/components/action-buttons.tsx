
import { useState } from "react"
import styled from "styled-components"
import type { Action } from "@/lib/types"
import { Loader2, XCircle } from "lucide-react"

interface ActionButtonsProps {
  actions: Action[]
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`

const ActionButton = styled.button<{ status?: string; $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  border-radius: 20px 5px 20px 20px;
  border: 1px solid #3F57E4;
  background: ${props => props.$isSelected ? '#3F57E4' : '#FFF'};
  color: ${props => props.$isSelected ? '#FFF' : '#3F57E4'};
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

  ${props => props.status === "failed" && `
    background: #ef4444;
    color: #FFF;
  `}
`

export function ActionButtons({ actions }: ActionButtonsProps) {
  const [actionStates] = useState<Record<string, string>>(
    Object.fromEntries(actions.map((a) => [a.id, a.status || "idle"])),
  )
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)

  const handleAction = (action: Action) => {
    console.log("[v0] Action triggered:", action.verb, action.payload)

    // Set selected action
    setSelectedActionId(action.id)
  }

  // Filter actions: if one is selected, only show that one
  const visibleActions = selectedActionId 
    ? actions.filter(a => a.id === selectedActionId)
    : actions

  return (
    <Container>
      {visibleActions.map((action) => {
        const status = actionStates[action.id]
        const isSelected = selectedActionId === action.id

        return (
          <ActionButton
            key={action.id}
            status={status}
            $isSelected={isSelected}
            onClick={() => handleAction(action)}
            disabled={status === "running"}
          >
            {status === "running" && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {status === "failed" && <XCircle size={14} />}
            {action.title}
          </ActionButton>
        )
      })}
    </Container>
  )
}
