"use client"

import type { ViewPart as ViewPartType } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ViewPartProps {
  part: ViewPartType
}

export function ViewPart({ part }: ViewPartProps) {
  const { content } = part

  if (content.viewType === "table") {
    return <TableView data={content.data} config={content.config} />
  }

  return (
    <Card className="p-4">
      <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>
    </Card>
  )
}

function TableView({ data, config }: { data: any[]; config?: any }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const columns = config?.columns || Object.keys(data[0])

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col: string) => (
              <TableHead key={col} className="font-semibold">
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col: string) => (
                <TableCell key={col} className="text-sm">
                  {row[col]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
