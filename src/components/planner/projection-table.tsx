import { ChannelSwatch } from '@/components/channel-swatch'
import { PlanDelta } from '@/components/planner/plan-delta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { channelLabel } from '@/lib/channels'
import { formatValue } from '@/lib/format'
import { METRICS } from '@/lib/metrics'
import type { PlanProjection, ProjectedResult } from '@/lib/planner'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { key: 'spend', label: 'Budget' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'roas', label: 'ROAS' },
  { key: 'orders', label: 'Orders' },
] as const

function Cells({ proposed, current }: { proposed: ProjectedResult; current: ProjectedResult }) {
  return COLUMNS.map(({ key }) => {
    const { format } = METRICS[key]
    return (
      <TableCell key={key} className="text-right align-top">
        <div className="tabular-nums" data-value={key}>{formatValue(format, proposed[key], { compact: format === 'currency' })}</div>
        <PlanDelta metric={key} proposed={proposed[key]} current={current[key]} />
      </TableCell>
    )
  })
}

/** Projected results per channel and in total, each with its change from the last 30 days. */
export function ProjectionTable({ proposed, current }: { proposed: PlanProjection; current: PlanProjection }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projected results</CardTitle>
        <CardDescription>Per month, compared with the last 30 days. Organic search has no spend and is left out.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table data-testid="projection-table">
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              {COLUMNS.map(({ key, label }) => (
                <TableHead key={key} className="text-right">{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposed.rows.map((row, i) => {
              const before = current.rows[i] ?? row
              return (
                <TableRow key={row.channel} className={cn(row.fixed && 'text-muted-foreground')} data-projection={row.channel}>
                  <TableCell className="align-top font-medium">
                    <span className="flex items-center gap-2">
                      <ChannelSwatch channel={row.channel} />
                      {channelLabel(row.channel)}
                    </span>
                    {row.fixed && <span className="ml-[18px] text-xs font-normal">Held fixed</span>}
                  </TableCell>
                  <Cells proposed={row} current={before} />
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow data-projection="total">
              <TableCell className="align-top">Total</TableCell>
              <Cells proposed={proposed.total} current={current.total} />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
