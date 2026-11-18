import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { LegendItem, TooltipCard, type TooltipRow } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { ChartContainer } from '@/components/ui/chart'
import type { DailyFact } from '@/data/types'
import { series } from '@/lib/aggregate'
import { formatDateAxis, formatPeriod, formatValue } from '@/lib/format'
import { METRICS, type MetricKey } from '@/lib/metrics'
import { comparisonState, defaultGranularity, metricTrend, type MetricTrendPoint } from '@/lib/summaries'
import { cn } from '@/lib/utils'
import { useFilteredData } from '@/store/use-filtered-data'

interface MetricTrendChartProps {
  metric: MetricKey
  facts: readonly DailyFact[]
  previousFacts: readonly DailyFact[]
  color: string
  className?: string
}

/** One metric over the global range, with the previous period dashed when compare is on. */
export function MetricTrendChart({ metric, facts, previousFacts, color, className }: MetricTrendChartProps) {
  const { range, previous, filters } = useFilteredData()
  const granularity = defaultGranularity(range)
  const showPrevious = comparisonState(filters.compare, previous) === 'on'
  const { label, format } = METRICS[metric]
  const data = metricTrend(metric, series(facts, range, granularity), showPrevious ? series(previousFacts, previous, granularity) : null)
  const axisFormat = (value: number) => formatValue(format, value, { compact: true })

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <LegendItem label={label} color={color} />
        {showPrevious && <LegendItem label="Previous period" color={color} dashed />}
      </div>
      <ChartContainer role="figure" config={{ value: { label, color } }} className="aspect-auto h-64 w-full" aria-label={`${label} over time`}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateAxis} tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
          <YAxis tickFormatter={axisFormat} tickLine={false} axisLine={false} width={56} domain={format === 'currency' || format === 'count' ? [0, 'auto'] : ['auto', 'auto']} />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            content={({ active, payload }) => {
              const point = tooltipDatum<MetricTrendPoint>(payload)
              if (!active || !point) return null
              const rows: TooltipRow[] = [{ label, value: formatValue(format, point.value), color }]
              if (point.previousDate !== undefined) rows.push({ label: 'Previous', value: formatValue(format, point.previousValue), color, dashed: true })
              const note = point.previousDate !== undefined ? `Previous: ${formatPeriod(point.previousDate, point.days)}` : undefined
              return <TooltipCard title={formatPeriod(point.date, point.days)} rows={rows} note={note} />
            }}
          />
          {showPrevious && <Line dataKey="previousValue" stroke={color} strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.45} dot={false} connectNulls animationDuration={300} />}
          <Line dataKey="value" stroke={color} strokeWidth={2} dot={false} connectNulls animationDuration={300} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
