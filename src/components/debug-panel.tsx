import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChannelSwatch } from '@/components/channel-swatch'
import { dailySeries, totalsByChannel, totalsByCampaign, weeklySeries } from '@/lib/aggregate'
import { CHANNEL_LIST } from '@/lib/channels'
import { formatCount, formatDateRange, formatDelta, formatValue } from '@/lib/format'
import { METRICS, percentChange, sumTotals, type MetricKey } from '@/lib/metrics'
import { useFilteredData } from '@/store/use-filtered-data'

// Temporary (M2): proves filters, aggregation and the previous period are right. Replaced by Overview in M3.

const SUMMARY_METRICS: readonly MetricKey[] = ['spend', 'revenue', 'orders', 'newCustomers', 'roas', 'cpa', 'cvr', 'ctr', 'aov']

export function DebugPanel() {
  const { filters, range, previous, facts, previousFacts, totals, previousTotals } = useFilteredData()
  const byChannel = totalsByChannel(facts)
  const daily = dailySeries(facts, range)
  const weekly = weeklySeries(facts, range)
  const reconciles = (points: typeof daily) => Math.abs(sumTotals(points).revenue - totals.revenue) < 0.01

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Filter state (debug)</CardTitle>
          <CardDescription>Temporary panel for M2. The Overview page replaces it in M3.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Range</dt>
            <dd data-testid="range">{formatDateRange(range.from, range.to)} ({range.days} days)</dd>
            <dt className="text-muted-foreground">Previous period</dt>
            <dd data-testid="previous">
              {formatDateRange(previous.from, previous.to)}
              {!previous.complete && ' (partly before data starts)'}
            </dd>
            <dt className="text-muted-foreground">Compare</dt>
            <dd>{filters.compare ? 'On' : 'Off'}</dd>
            <dt className="text-muted-foreground">Rows</dt>
            <dd>{formatCount(facts.length)} current · {formatCount(previousFacts.length)} previous · {totalsByCampaign(facts).size} campaigns</dd>
            <dt className="text-muted-foreground">Series</dt>
            <dd>
              {daily.length} days ({reconciles(daily) ? 'sum matches' : 'MISMATCH'}) · {weekly.length} weeks ({reconciles(weekly) ? 'sum matches' : 'MISMATCH'})
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="totals">
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUMMARY_METRICS.map((key) => {
                const metric = METRICS[key]
                const current = metric.compute(totals)
                const prior = metric.compute(previousTotals)
                return (
                  <TableRow key={key}>
                    <TableCell>{metric.label}</TableCell>
                    <TableCell className="text-right" data-metric={key}>{formatValue(metric.format, current)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatValue(metric.format, prior)}</TableCell>
                    <TableCell className="text-right">{formatDelta(percentChange(current, prior))}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>By channel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="by-channel">
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">CPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CHANNEL_LIST.filter(({ key }) => byChannel.has(key)).map(({ key, label }) => {
                const t = byChannel.get(key) ?? totals
                return (
                  <TableRow key={key}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <ChannelSwatch channel={key} />
                        {label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatValue('currency', t.spend)}</TableCell>
                    <TableCell className="text-right">{formatValue('currency', t.revenue)}</TableCell>
                    <TableCell className="text-right">{formatValue('multiplier', METRICS.roas.compute(t))}</TableCell>
                    <TableCell className="text-right">{formatValue('count', t.orders)}</TableCell>
                    <TableCell className="text-right">{formatValue('unitCost', METRICS.cpa.compute(t))}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatValue('currency', totals.spend)}</TableCell>
                <TableCell className="text-right">{formatValue('currency', totals.revenue)}</TableCell>
                <TableCell className="text-right">{formatValue('multiplier', METRICS.roas.compute(totals))}</TableCell>
                <TableCell className="text-right">{formatValue('count', totals.orders)}</TableCell>
                <TableCell className="text-right">{formatValue('unitCost', METRICS.cpa.compute(totals))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
