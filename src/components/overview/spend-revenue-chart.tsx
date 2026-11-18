import { useId, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts'
import { LegendItem, TooltipCard, type TooltipRow } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { series, type Granularity } from '@/lib/aggregate'
import { SERIES_COLORS } from '@/lib/channels'
import { formatCurrency, formatCurrencyCompact, formatDateAxis, formatDateRange, formatPeriod } from '@/lib/format'
import { comparisonState, defaultGranularity, spendRevenueTrend, type TrendPoint } from '@/lib/summaries'
import { useFilteredData } from '@/store/use-filtered-data'

const config = {
  revenue: { label: 'Revenue', color: SERIES_COLORS.revenue },
  spend: { label: 'Spend', color: SERIES_COLORS.spend },
}

export function SpendRevenueChart() {
  const { facts, previousFacts, range, previous, filters } = useFilteredData()
  const [chosen, setGranularity] = useState<Granularity | null>(null)
  const granularity = chosen ?? defaultGranularity(range)
  const showPrevious = comparisonState(filters.compare, previous) === 'on'
  const data = spendRevenueTrend(series(facts, range, granularity), showPrevious ? series(previousFacts, previous, granularity) : null)
  const fillId = `revenue-fill-${useId().replace(/:/g, '')}`

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Spend vs. revenue</CardTitle>
        <CardDescription>{formatDateRange(range.from, range.to)}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={granularity}
            onValueChange={(value) => (value === 'daily' || value === 'weekly') && setGranularity(value)}
            aria-label="Granularity"
          >
            <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
            <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <LegendItem label="Revenue" color={SERIES_COLORS.revenue} />
          <LegendItem label="Spend" color={SERIES_COLORS.spend} />
          {showPrevious && <LegendItem label="Previous period" color="var(--muted-foreground)" dashed />}
        </div>
        <ChartContainer config={config} className="aspect-auto h-72 w-full" aria-label="Spend and revenue over time">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateAxis} tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
            <YAxis tickFormatter={formatCurrencyCompact} tickLine={false} axisLine={false} width={56} />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={({ active, payload }) => <TrendTooltip active={active} point={tooltipDatum<TrendPoint>(payload)} />} />
            {showPrevious && (
              <>
                <Line dataKey="previousRevenue" stroke="var(--color-revenue)" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.45} dot={false} animationDuration={300} />
                <Line dataKey="previousSpend" stroke="var(--color-spend)" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.45} dot={false} animationDuration={300} />
              </>
            )}
            <Area dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} fill={`url(#${fillId})`} animationDuration={300} />
            <Line dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} animationDuration={300} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function TrendTooltip({ active, point }: { active?: boolean; point?: TrendPoint }) {
  if (!active || !point) return null
  const rows: TooltipRow[] = [
    { label: 'Revenue', value: formatCurrency(point.revenue), color: SERIES_COLORS.revenue },
    { label: 'Spend', value: formatCurrency(point.spend), color: SERIES_COLORS.spend },
  ]
  if (point.previousDate !== undefined) {
    rows.push(
      { label: 'Previous revenue', value: formatCurrency(point.previousRevenue), color: SERIES_COLORS.revenue, dashed: true },
      { label: 'Previous spend', value: formatCurrency(point.previousSpend), color: SERIES_COLORS.spend, dashed: true },
    )
  }
  const note = point.previousDate !== undefined ? `Previous: ${formatPeriod(point.previousDate, point.days)}` : undefined
  return <TooltipCard title={formatPeriod(point.date, point.days)} rows={rows} note={note} />
}
