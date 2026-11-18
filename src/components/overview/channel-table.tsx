import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { SortableHead } from '@/components/sortable-head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { channelColor } from '@/lib/channels'
import { filterSearch } from '@/lib/filter-params'
import { formatCurrency, formatMultiplier, formatPercent, formatUnitCost } from '@/lib/format'
import { METRICS } from '@/lib/metrics'
import { nextSort, sortRows, type SortState } from '@/lib/sort'
import { channelRows, type ChannelRow } from '@/lib/summaries'
import { useFilteredData } from '@/store/use-filtered-data'

type Column = 'label' | 'spend' | 'revenue' | 'roas' | 'cpa' | 'cvr' | 'spendShare'

export function ChannelTable() {
  const { facts, filters, totals } = useFilteredData()
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortState<Column>>({ key: 'spend', direction: 'desc' })
  const rows = sortRows(channelRows(facts, filters.channels), sort, (row, key) => row[key])
  const openChannel = (row: ChannelRow) => navigate({ pathname: `/channels/${row.key}`, search: filterSearch(filters) })
  const onSort = (column: Column) => setSort((current) => nextSort(current, column, column === 'label'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <CardDescription>Select a channel to drill in</CardDescription>
      </CardHeader>
      <CardContent>
        <Table data-testid="channel-table">
          <TableHeader>
            <TableRow>
              <SortableHead column="label" sort={sort} onSort={onSort} align="left">Channel</SortableHead>
              <SortableHead column="spend" sort={sort} onSort={onSort}>Spend</SortableHead>
              <SortableHead column="revenue" sort={sort} onSort={onSort}>Revenue</SortableHead>
              <SortableHead column="roas" sort={sort} onSort={onSort}>ROAS</SortableHead>
              <SortableHead column="cpa" sort={sort} onSort={onSort}>CPA</SortableHead>
              <SortableHead column="cvr" sort={sort} onSort={onSort}>CVR</SortableHead>
              <SortableHead column="spendShare" sort={sort} onSort={onSort} align="left" className="w-40">Share of spend</SortableHead>
              <TableHead className="w-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.key}
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => openChannel(row)}
                onKeyDown={(event) => event.key === 'Enter' && openChannel(row)}
              >
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <ChannelSwatch channel={row.key} />
                    {row.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                <TableCell className="text-right">{formatMultiplier(row.roas)}</TableCell>
                <TableCell className="text-right">{formatUnitCost(row.cpa)}</TableCell>
                <TableCell className="text-right">{formatPercent(row.cvr)}</TableCell>
                <TableCell>
                  <ShareBar share={row.spendShare} color={channelColor(row.key)} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.spend)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
              <TableCell className="text-right">{formatMultiplier(METRICS.roas.compute(totals))}</TableCell>
              <TableCell className="text-right">{formatUnitCost(METRICS.cpa.compute(totals))}</TableCell>
              <TableCell className="text-right">{formatPercent(METRICS.cvr.compute(totals))}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}

function ShareBar({ share, color }: { share: number | null; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(share ?? 0) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 text-right text-sm text-muted-foreground">{formatPercent(share)}</span>
    </div>
  )
}
