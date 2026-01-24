
import type { InsightPart } from "@/lib/types"
import styled from "styled-components"
import { Icon } from "@pega/cosmos-react-core"

interface InsightCardProps {
  part: InsightPart
}

const Card = styled.div<{ $bg?: string }>`
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: ${props => props.$bg || '#fff'};
`

const CardHeader = styled.div`
  padding-bottom: 12px;
  padding: 16px;
`

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const HeaderText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`

const CardDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`

const CardContent = styled.div`
  padding: 16px;
  padding-top: 0;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MetricLabel = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`

const MetricValue = styled.p`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`

const IconWrapper = styled.div<{ $color?: string }>`
  margin-top: 2px;
  color: ${props => props.$color || '#374151'};
`

export function InsightCard({ part }: InsightCardProps) {
  const { content } = part
  const severity = content.severity || "info"

  const severityConfig = {
    info: { iconName: "information", color: "#2563eb", bg: "#eff6ff" },
    warning: { iconName: "warn", color: "#d97706", bg: "#fffbeb" },
    error: { iconName: "warn", color: "#ef4444", bg: "#fef2f2" },
    success: { iconName: "check", color: "#10b981", bg: "#f0fdf4" },
  }

  const config = severityConfig[severity]

  return (
    <Card $bg={config.bg}>
      <CardHeader>
        <HeaderContent>
          <IconWrapper $color={config.color}>
            <Icon name={config.iconName} size="s" />
          </IconWrapper>
          <HeaderText>
            <CardTitle>{content.title}</CardTitle>
            <CardDescription>{content.description}</CardDescription>
          </HeaderText>
        </HeaderContent>
      </CardHeader>

      {content.metrics && content.metrics.length > 0 && (
        <CardContent>
          <MetricsGrid>
            {content.metrics.map((metric, idx) => (
              <MetricItem key={idx}>
                <MetricLabel>{metric.label}</MetricLabel>
                <MetricValue>{metric.value}</MetricValue>
              </MetricItem>
            ))}
          </MetricsGrid>
        </CardContent>
      )}
    </Card>
  )
}
