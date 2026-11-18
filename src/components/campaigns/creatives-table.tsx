import { GalleryHorizontal, Image, PlaySquare, TriangleAlert } from 'lucide-react'
import { SortableHead } from '@/components/sortable-head'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CreativeFormat } from '@/data/types'
import { FATIGUE_RULE, type CreativeRow } from '@/lib/creatives'
import { formatCount, formatDateRange, formatDelta, formatPercent, formatUnitCost } from '@/lib/format'
import { deltaTone, METRICS } from '@/lib/metrics'
import type { SortState } from '@/lib/sort'
import type { CreativeColumn } from './use-sorted-creatives'
import { cn } from '@/lib/utils'

const FORMAT_ICON = { image: Image, video: PlaySquare, carousel: GalleryHorizontal } as const
const TONE_CLASS = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' } as const

export function CreativesTable({ rows, sort, onSort, showCampaign = true }: { rows: readonly CreativeRow[]; sort: SortState<CreativeColumn>; onSort: (column: CreativeColumn) => void; showCampaign?: boolean }) {
  const head = { sort, onSort }
  return (
    <Table data-testid="creatives-table">
      <TableHeader>
        <TableRow>
          <SortableHead column="name" align="left" {...head}>Creative</SortableHead>
          <SortableHead column="impressions" {...head}>Impressions</SortableHead>
          <SortableHead column="ctr" {...head}>CTR</SortableHead>
          <SortableHead column="ctrChange" {...head}>CTR, 21-day change</SortableHead>
          <SortableHead column="frequency" {...head}>Frequency</SortableHead>
          <SortableHead column="cpa" {...head}>CPA</SortableHead>
          <SortableHead column="fatigue" align="left" {...head}>Status</SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const change = row.signal?.ctrChange ?? null
          return (
            <TableRow key={row.id} data-creative={row.name}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Thumbnail format={row.format} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.name}</div>
                    <div className="truncate text-xs text-muted-foreground capitalize">
                      {row.format}
                      {showCampaign && <span className="font-mono normal-case"> · {row.campaignName}</span>}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCount(row.impressions)}</TableCell>
              <TableCell className="text-right">{formatPercent(row.ctr)}</TableCell>
              <TableCell className={cn('text-right', TONE_CLASS[deltaTone(METRICS.ctr.goodDirection, change)])}>{formatDelta(change)}</TableCell>
              <TableCell className="text-right">{row.frequency === null ? '—' : row.frequency.toFixed(1)}</TableCell>
              <TableCell className="text-right">{formatUnitCost(row.cpa)}</TableCell>
              <TableCell>
                {row.signal?.fatigued ? <FatigueBadge row={row} /> : <span className="text-sm text-muted-foreground">Healthy</span>}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function Thumbnail({ format }: { format: CreativeFormat }) {
  const Icon = FORMAT_ICON[format]
  return (
    <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-muted to-accent">
      <Icon className="size-4 text-muted-foreground" />
    </div>
  )
}

function FatigueBadge({ row }: { row: CreativeRow }) {
  const signal = row.signal
  if (!signal) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/10 text-foreground" data-fatigue>
          <TriangleAlert className="size-3 text-warning" />
          Fatigue
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {formatDateRange(signal.from, signal.to)}: frequency {signal.frequencyFrom.toFixed(1)} → {signal.frequencyTo.toFixed(1)}, CTR {formatDelta(signal.ctrChange)}, CPA {formatDelta(signal.cpaChange)} (first vs last {FATIGUE_RULE.segmentDays} days)
      </TooltipContent>
    </Tooltip>
  )
}
