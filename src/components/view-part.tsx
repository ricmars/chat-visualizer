
import type { ViewPart as ViewPartType } from "@/lib/types"
import styled from "styled-components"

interface ViewPartProps {
  part: ViewPartType
}

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`

const Pre = styled.pre`
  font-size: 12px;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`

const TableContainer = styled(Card)`
  padding: 0;
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: rgba(0, 0, 0, 0.02);
`

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`

const TableHead = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
`

const TableBody = styled.tbody``

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
`

export function ViewPart({ part }: ViewPartProps) {
  const { content } = part

  if (content.viewType === "table") {
    return <TableView data={content.data} config={content.config} />
  }

  return (
    <Card>
      <Pre>{JSON.stringify(content, null, 2)}</Pre>
    </Card>
  )
}

function TableView({ data, config }: { data: any[]; config?: any }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const columns = config?.columns || Object.keys(data[0])

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col: string) => (
              <TableHead key={col}>
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col: string) => (
                <TableCell key={col}>
                  {row[col]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
