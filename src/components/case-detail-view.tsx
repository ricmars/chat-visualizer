import { Card, CardContent, MultiStepForm } from "@pega/cosmos-react-core"
import type { Step } from "@pega/cosmos-react-core/lib/components/MultiStepForm/MultiStepForm.types"
import { Details, Stages } from "@pega/cosmos-react-work"
import type { StageProps } from "@pega/cosmos-react-work/lib/components/Stages/Stages.types"
import styled from "styled-components"
import { Pencil } from "lucide-react"
import { useMemo } from "react"
import type { Case } from "@/lib/types"

interface CaseDetailViewProps {
  case: Case
}

type CampaignDetails = {
  eligibility: string[]
  applicability: string[]
  suitability: string[]
  contactPolicy: string
}

type SupportDetails = {
  issueDescription: string[]
  investigation: string[]
  resolution: string[]
  notes: string
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

const CaseHeader = styled.div`
  background: #E0E7FF;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  margin-bottom: 24px;
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

export function CaseDetailView({ case: caseInfo }: CaseDetailViewProps) {
  // Determine case type based on case ID prefix or stage structure
  const isCampaignCase = caseInfo.id.startsWith("CA-")
  const isSupportCase = caseInfo.id.startsWith("SR-")

  // Transform case stages into mainStages and subStages based on case type
  const { mainStagesData, mainCurrent, subStages, subCurrent, details } = useMemo(() => {
    const currentStatusIndex = caseInfo.stages.findIndex(s => s.id === caseInfo.status)
    
    if (isCampaignCase) {
      // Campaign case: Use ALL stages as main stages
      const mainStages = caseInfo.stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        completed: index < currentStatusIndex,
      }))
      
      // Find campaign-specific sub stages from case stages (these are the detail stages)
      const campaignSubStageIds = ["attributes", "availability", "engagement-policy", "channels"]
      const campaignSubStages = caseInfo.stages
        .filter(stage => campaignSubStageIds.includes(stage.id))
        .map((stage) => {
          const stageIndex = caseInfo.stages.findIndex(s => s.id === stage.id)
          return {
            id: stage.id,
            name: stage.name,
            completed: stageIndex < currentStatusIndex,
          }
        })
      
      // Determine current sub stage - find the sub stage that matches current status, or the active one
      const currentSubStage = campaignSubStages.find(s => s.id === caseInfo.status)?.id ||
        campaignSubStages.filter(s => {
          const subStageIndex = caseInfo.stages.findIndex(st => st.id === s.id)
          return subStageIndex <= currentStatusIndex
        }).pop()?.id ||
        campaignSubStages[0]?.id || "attributes"
      
      // Campaign-specific details
      const campaignDetails = {
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
      
      return {
        mainStagesData: mainStages,
        mainCurrent: caseInfo.status,
        subStages: campaignSubStages.length > 0 ? campaignSubStages : [
          { id: "attributes", name: "Attributes", completed: true },
          { id: "availability", name: "Availability", completed: true },
          { id: "engagement-policy", name: "Engagement Policy", completed: false },
          { id: "channels", name: "Channels", completed: false },
        ],
        subCurrent: currentSubStage,
        details: campaignDetails,
      }
    } else if (isSupportCase) {
      // Support case: Use ALL stages as main stages
      const mainStages = caseInfo.stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        completed: index < currentStatusIndex,
      }))
      
      // For support cases, we can use all stages as sub stages too, or just show details for current stage
      // Let's use all stages as sub stages for consistency
      const supportSubStages = caseInfo.stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        completed: index < currentStatusIndex,
      }))
      
      // Support case-specific details
      const supportDetails = {
        issueDescription: [
          "Transaction ID: TXN-2024-001234",
          "Error Code: PAYMENT_FAILED_001",
          "Customer reported payment processing failure",
          "Transaction amount: $1,250.00",
        ],
        investigation: [
          "Verified payment gateway connectivity",
          "Checked customer account status",
          "Reviewed transaction logs",
        ],
        resolution: [
          "Identified temporary gateway timeout",
          "Retried transaction successfully",
          "Customer notified of resolution",
        ],
        notes: "Follow-up required to ensure customer satisfaction",
      }
      
      return {
        mainStagesData: mainStages,
        mainCurrent: caseInfo.status,
        subStages: supportSubStages,
        subCurrent: caseInfo.status,
        details: supportDetails,
      }
    } else {
      // Default/unknown case type - use all stages
      const mainStages = caseInfo.stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        completed: index < currentStatusIndex,
      }))
      
      const defaultSubStages = caseInfo.stages.slice(3).map((stage) => {
        const stageIndex = caseInfo.stages.findIndex(s => s.id === stage.id)
        return {
          id: stage.id,
          name: stage.name,
          completed: stageIndex < currentStatusIndex,
        }
      })
      
      const defaultDetails = {
        eligibility: [
          "Age is greater than 25",
          "and Credit Score is greater than 750",
        ],
        applicability: [
          "Customer LifeCyclePeriod is equal to Onboard",
        ],
        suitability: [
          "Customer Annual Income is greater than or equal to 5,000",
        ],
        contactPolicy: "—",
      }
      
      return {
        mainStagesData: mainStages,
        mainCurrent: caseInfo.status,
        subStages: defaultSubStages.length > 0 ? defaultSubStages : [
          { id: "attributes", name: "Attributes", completed: true },
          { id: "availability", name: "Availability", completed: true },
        ],
        subCurrent: defaultSubStages[0]?.id || caseInfo.status,
        details: defaultDetails,
      }
    }
  }, [caseInfo, isCampaignCase, isSupportCase])
  
  const mainStages: StageProps[] = useMemo(() => {
    return mainStagesData.map((stage) => ({
      id: stage.id,
      name: stage.name,
      completed: stage.completed,
    }))
  }, [mainStagesData])

  const detailsContent = useMemo(() => {
    if (isCampaignCase) {
      // Campaign case details
      const campaignDetails = details as CampaignDetails
      return (
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
                {campaignDetails.eligibility?.map((condition: string, idx: number) => (
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
                {campaignDetails.applicability?.map((condition: string, idx: number) => (
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
                {campaignDetails.suitability?.map((condition: string, idx: number) => (
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
            <SectionContent>{campaignDetails.contactPolicy}</SectionContent>
          </Section>
        </>
      )
    } else if (isSupportCase) {
      // Support case details
      const supportDetails = details as SupportDetails
      return (
        <>
          <Section>
            <SectionHeader>
              <SectionTitle>Issue Description</SectionTitle>
              <EditIcon aria-label="Edit Issue Description">
                <Pencil size={14} />
              </EditIcon>
            </SectionHeader>
            <SectionContent>
              <ConditionList>
                {supportDetails.issueDescription?.map((item: string, idx: number) => (
                  <ConditionItem key={idx}>{item}</ConditionItem>
                ))}
              </ConditionList>
            </SectionContent>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Investigation</SectionTitle>
              <EditIcon aria-label="Edit Investigation">
                <Pencil size={14} />
              </EditIcon>
            </SectionHeader>
            <SectionContent>
              <ConditionList>
                {supportDetails.investigation?.map((item: string, idx: number) => (
                  <ConditionItem key={idx}>{item}</ConditionItem>
                ))}
              </ConditionList>
            </SectionContent>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Resolution</SectionTitle>
              <EditIcon aria-label="Edit Resolution">
                <Pencil size={14} />
              </EditIcon>
            </SectionHeader>
            <SectionContent>
              <ConditionList>
                {supportDetails.resolution?.map((item: string, idx: number) => (
                  <ConditionItem key={idx}>{item}</ConditionItem>
                ))}
              </ConditionList>
            </SectionContent>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Notes</SectionTitle>
              <EditIcon aria-label="Edit Notes">
                <Pencil size={14} />
              </EditIcon>
            </SectionHeader>
            <SectionContent>{supportDetails.notes}</SectionContent>
          </Section>
        </>
      )
    } else {
      // Default/fallback details
      const defaultDetails = details as CampaignDetails
      return (
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
                {defaultDetails.eligibility?.map((condition: string, idx: number) => (
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
                {defaultDetails.applicability?.map((condition: string, idx: number) => (
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
                {defaultDetails.suitability?.map((condition: string, idx: number) => (
                  <ConditionItem key={idx}>{condition}</ConditionItem>
                ))}
              </ConditionList>
            </SectionContent>
          </Section>
        </>
      )
    }
  }, [details, isCampaignCase, isSupportCase])

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

        <CaseHeader>
          <CaseHeaderLeft>
            <CaseTitle>{caseInfo.name}</CaseTitle>
            <CaseId>{caseInfo.id}</CaseId>
          </CaseHeaderLeft>
        </CaseHeader>

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

