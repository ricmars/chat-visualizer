import type { CasePart as CasePartType, ChatMessage } from "@/lib/types"
import styled from "styled-components"
import { Link, Check } from "lucide-react"

interface CasePartProps {
  part: CasePartType
  message: ChatMessage
}

const CaseCard = styled.div`
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`

const CaseHeader = styled.div`
  background: #E0E7FF;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const CaseHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`

const CaseTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CaseId = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
`

const CaseStatus = styled.span`
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  white-space: nowrap;
`

const CaseHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const LinkIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F57E4;
  width: 20px;
  height: 20px;
`

const CaseContent = styled.div`
  padding: 24px 20px;
`

const WorkflowSection = styled.div`
  margin-bottom: 24px;
`

const WorkflowTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
`

const WorkflowStageInfo = styled.span`
  color: #6b7280;
  font-weight: 400;
`

const StagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 20px;
`

const StageItem = styled.div<{ isCompleted: boolean; isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  padding-bottom: 16px;
  
  &:last-child {
    padding-bottom: 0;
  }
  
  ${props => !props.isCompleted && !props.isActive && `
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 8px;
      width: 2px;
      height: calc(100% + 8px);
      background: #e5e7eb;
    }
  `}
  
  ${props => props.isCompleted && `
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 8px;
      width: 2px;
      height: calc(100% + 8px);
      background: #10b981;
    }
  `}
  
  ${props => props.isActive && `
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 8px;
      width: 2px;
      height: calc(100% + 8px);
      background: linear-gradient(to bottom, #3F57E4 0%, #3F57E4 50%, #e5e7eb 50%, #e5e7eb 100%);
    }
  `}
`

const StageCircle = styled.div<{ isCompleted: boolean; isActive: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: ${props => props.isCompleted ? 'none' : props.isActive ? '2px solid #3F57E4' : '2px solid #d1d5db'};
  background: ${props => props.isCompleted ? '#10b981' : props.isActive ? '#fff' : '#fff'};
  position: relative;
  flex-shrink: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3F57E4;
    }
  `}
`

const CheckIcon = styled(Check)`
  width: 10px;
  height: 10px;
  color: white;
  stroke-width: 3;
`

const StageName = styled.span<{ isCompleted: boolean; isActive: boolean }>`
  font-size: 14px;
  color: ${props => props.isActive ? '#111827' : props.isCompleted ? '#111827' : '#6b7280'};
  font-weight: ${props => props.isActive ? '500' : '400'};
`

export function CasePart({ part: _part, message }: CasePartProps) {
  // Get case data from message level, not from part content
  if (!message.case) {
    return null
  }
  
  const { id, name, status, stages } = message.case

  // Find the current stage index based on status
  const currentStageIndex = stages.findIndex(stage => stage.id === status)
  const currentStageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 1
  const totalStages = stages.length

  // Get the display name for the current status
  const currentStageName = currentStageIndex >= 0 ? stages[currentStageIndex].name : status

  return (
    <CaseCard>
      <CaseHeader>
        <CaseHeaderLeft>
          <CaseTitle>{name}</CaseTitle>
          <CaseId>{id}</CaseId>
          <CaseStatus>{currentStageName}</CaseStatus>
        </CaseHeaderLeft>
        <CaseHeaderRight>
          <LinkIcon>
            <Link size={16} />
          </LinkIcon>
        </CaseHeaderRight>
      </CaseHeader>
      
      <CaseContent>
        <WorkflowSection>
          <WorkflowTitle>
            Workflow stage: <WorkflowStageInfo>{currentStageName} {currentStageNumber} of {totalStages}</WorkflowStageInfo>
          </WorkflowTitle>
          
          <StagesList>
            {stages.map((stage, index) => {
              const isCompleted = currentStageIndex > index
              const isActive = currentStageIndex === index
              
              return (
                <StageItem key={stage.id} isCompleted={isCompleted} isActive={isActive}>
                  <StageCircle isCompleted={isCompleted} isActive={isActive}>
                    {isCompleted && <CheckIcon />}
                  </StageCircle>
                  <StageName isCompleted={isCompleted} isActive={isActive}>
                    {stage.name}
                  </StageName>
                </StageItem>
              )
            })}
          </StagesList>
        </WorkflowSection>
      </CaseContent>
    </CaseCard>
  )
}

