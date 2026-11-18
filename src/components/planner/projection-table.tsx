import { useState } from 'react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { ExportButton } from '@/components/export-button'
import { PlanDelta } from '@/components/planner/plan-delta'
import { SortableHead } from '@/components/sortable-head'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { channelLabel } from '@/lib/channels'
import { toCsv } from '@/lib/csv'
import { PLAN_CSV } from '@/lib/exports'
import { formatValue } from '@/lib/format'
import { METRICS } from '@/lib/metrics'
import type { PlanProjection, ProjectedResult } from '@/lib/planner'
import { nextSort, sortRows, type SortState } from '@/lib/sort'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { key: 'spend', label: 'Budget' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'roas', label: 'ROAS' },
  { key: 'orders', label: 'Orders' },
] as const

type Column = 'channel' | (typeof COLUMNS)[number]['key']

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
  const [sort, setSort] = useState<SortState<Column> | null>(null)
  const pairs = proposed.rows.map((row) => ({ proposed: row, current: current.rows.find((r) => r.channel === row.channel) ?? row }))
  // Unsorted keeps the planner's own order: adjustable channels, then the fixed ones.
  const rows = sort ? sortRows(pairs, sort, (pair, key) => (key === 'channel' ? channelLabel(pair.proposed.channel) : pair.proposed[key])) : pairs
  const onSort = (column: Column) => setSort((state) => nextSort(state, column, column === 'channel'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projected results</CardTitle>
        <CardDescription>Per month, compared with the last 30 days. Organic search has no spend and is left out.</CardDescription>
        <CardAction>
          <ExportButton filename="pulse-budget-plan.csv" build={() => toCsv(rows, PLAN_CSV)} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table data-testid="projection-table">
          <TableHeader>
            <TableRow>
              <SortableHead column="channel" sort={sort} onSort={onSort} align="left">Channel</SortableHead>
              {COLUMNS.map(({ key, label }) => (
                <SortableHead key={key} column={key} sort={sort} onSort={onSort}>{label}</SortableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ proposed: row, current: before }) => (
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
            ))}
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
