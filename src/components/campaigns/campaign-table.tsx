import { ChannelBadge } from '@/components/channel-badge'
import { Sparkline } from '@/components/charts/sparkline'
import { PacingBar } from '@/components/pacing-bar'
import { SortableHead } from '@/components/sortable-head'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMediaQuery, WIDE_SCREEN } from '@/hooks/use-media-query'
import type { CampaignRow } from '@/lib/campaigns'
import { SERIES_COLORS } from '@/lib/channels'
import { formatCurrency, formatMultiplier, formatUnitCost } from '@/lib/format'
import { rowAction } from '@/lib/row-action'
import type { SortState } from '@/lib/sort'
import type { CampaignColumn } from './use-sorted-campaigns'

interface CampaignTableProps {
  rows: readonly CampaignRow[]
  sort: SortState<CampaignColumn>
  onSort: (column: CampaignColumn) => void
  onOpen: (id: string) => void
  showChannel?: boolean
}

export function CampaignTable({ rows, sort, onSort, onOpen, showChannel = true }: CampaignTableProps) {
  const head = { sort, onSort }
  // Narrow screens drop the trend column, and the channel badge (the name already starts with the channel).
  const wide = useMediaQuery(WIDE_SCREEN)
  const channelColumn = showChannel && wide
  return (
    <Table data-testid="campaign-table">
      <TableHeader>
        <TableRow>
          <SortableHead column="name" align="left" {...head}>Campaign</SortableHead>
          {channelColumn && <SortableHead column="channel" align="left" {...head}>Channel</SortableHead>}
          <SortableHead column="status" align="left" {...head}>Status</SortableHead>
          <SortableHead column="spend" {...head}>Spend</SortableHead>
          <SortableHead column="revenue" {...head}>Revenue</SortableHead>
          <SortableHead column="roas" {...head}>ROAS</SortableHead>
          <SortableHead column="cpa" {...head}>CPA</SortableHead>
          <SortableHead column="pacing" align="left" {...head}>Budget pacing</SortableHead>
          {wide && <TableHead>Spend, last 30 days</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            data-campaign={row.id}
            {...rowAction(() => onOpen(row.id))}
          >
            <TableCell className="font-mono text-[13px] font-medium">{row.name}</TableCell>
            {channelColumn && (
              <TableCell>
                <ChannelBadge channel={row.channel} />
              </TableCell>
            )}
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
            <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
            <TableCell className="text-right">{formatMultiplier(row.roas)}</TableCell>
            <TableCell className="text-right">{formatUnitCost(row.cpa)}</TableCell>
            <TableCell>
              <PacingBar pacing={row.pacing} />
            </TableCell>
            {wide && (
              <TableCell>
                <div className="w-28">
                  <Sparkline data={row.trend} label="Spend" format="currency" color={SERIES_COLORS.spend} className="h-8" tooltipSide="left" />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
