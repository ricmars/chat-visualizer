import { Card, CardContent, MultiStepForm } from "@pega/cosmos-react-core"
import type { Step } from "@pega/cosmos-react-core/lib/components/MultiStepForm/MultiStepForm.types"
import { Details, Stages } from "@pega/cosmos-react-work"
import type { StageProps } from "@pega/cosmos-react-work/lib/components/Stages/Stages.types"
import styled from "styled-components"
import { Pencil } from "lucide-react"
import { useMemo } from "react"

interface CaseDetailViewProps {
  caseData?: {
    id?: string
    mainStages?: Array<{
      id: string
      name: string
      completed: boolean
    }>
    mainCurrent?: string
    subStages?: Array<{
      id: string
      name: string
      completed: boolean
    }>
    subCurrent?: string
    details?: {
      eligibility?: string[]
      applicability?: string[]
      suitability?: string[]
      contactPolicy?: string
    }
  }
}

const Section = styled.div`
  margin-bottom: 32px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`

const EditIcon = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  padding: 0;

  &:hover {
    color: #374151;
  }
`

const SectionContent = styled.div`
  font-size: 16px;
  color: #111827;
  line-height: 1.6;
`

const ConditionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ConditionItem = styled.div`
  font-size: 16px;
  color: #111827;
`

export function CaseDetailView({ caseData }: CaseDetailViewProps) {
  // Default data structure based on the screenshot
  const defaultMainStages = [
    { id: "build", name: "Build", completed: false },
    { id: "approve", name: "Approve", completed: false },
    { id: "publish", name: "Publish", completed: false },
  ]

  const defaultSubStages = [
    { id: "attributes", name: "Attributes", completed: true },
    { id: "availability", name: "Availability", completed: true },
    { id: "engagement-policy", name: "Engagement Policy", completed: false },
    { id: "channels", name: "Channels", completed: false },
  ]

  const defaultDetails = {
    eligibility: [
      "Age is greater than 25",
      "and Credit Score is greater than 750",
      "and Account History (months) is greater than or equal to 24",
      "and is a Gold Card User",
      "Location is USA",
    ],
    applicability: [
      "Customer LifeCyclePeriod is equal to Onboard",
      "and Customer HasCards is equal to Y",
    ],
    suitability: [
      "Customer Annual Income is greater than or equal to 5,000",
    ],
    contactPolicy: "—",
  }

  const mainStagesData = caseData?.mainStages || defaultMainStages
  const mainCurrent = caseData?.mainCurrent || "build"
  
  const mainStages: StageProps[] = useMemo(() => {
    return mainStagesData.map((stage) => ({
      id: stage.id,
      name: stage.name,
      completed: stage.completed,
    }))
  }, [mainStagesData])
  const subStages = caseData?.subStages || defaultSubStages
  const subCurrent = caseData?.subCurrent || "engagement-policy"
  const details = caseData?.details || defaultDetails

  const detailsContent = useMemo(() => (
    <>
      <Section>
        <SectionHeader>
          <SectionTitle>Eligibility</SectionTitle>
          <EditIcon aria-label="Edit Eligibility">
            <Pencil size={14} />
          </EditIcon>
        </SectionHeader>
        <SectionContent>
          <ConditionList>
            {details.eligibility?.map((condition, idx) => (
              <ConditionItem key={idx}>{condition}</ConditionItem>
            ))}
          </ConditionList>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Applicability</SectionTitle>
          <EditIcon aria-label="Edit Applicability">
            <Pencil size={14} />
          </EditIcon>
        </SectionHeader>
        <SectionContent>
          <ConditionList>
            {details.applicability?.map((condition, idx) => (
              <ConditionItem key={idx}>{condition}</ConditionItem>
            ))}
          </ConditionList>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Suitability</SectionTitle>
          <EditIcon aria-label="Edit Suitability">
            <Pencil size={14} />
          </EditIcon>
        </SectionHeader>
        <SectionContent>
          <ConditionList>
            {details.suitability?.map((condition, idx) => (
              <ConditionItem key={idx}>{condition}</ConditionItem>
            ))}
          </ConditionList>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Contact Policy</SectionTitle>
          <EditIcon aria-label="Edit Contact Policy">
            <Pencil size={14} />
          </EditIcon>
        </SectionHeader>
        <SectionContent>{details.contactPolicy}</SectionContent>
      </Section>
      
      </>
  ), [details])

  const steps: Step[] = useMemo(() => {
    return subStages.map((stage) => {
      return {
        id: stage.id,
        name: stage.name,
        content: stage.id === subCurrent ? (
          <Details
            columns={{
              a: detailsContent,
            }}
          />
        ) : (
          <div style={{ padding: "16px 0" }}>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              {stage.completed ? "Completed" : "Not started"}
            </p>
          </div>
        ),
        depth: 1 as const,
      }
    })
  }, [subStages, subCurrent, detailsContent])

  return (
      <Card>
        <CardContent>
        <Section>
          <Stages
            stages={mainStages}
            current={mainCurrent}
          />
        </Section>

        <Section>
          <MultiStepForm
            steps={steps}
            currentStepId={subCurrent}
            stepIndicator="horizontal"
          />
        </Section>
        </CardContent>
      </Card>
  )
}

