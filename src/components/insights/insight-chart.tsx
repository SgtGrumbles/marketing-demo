import { Bar, BarChart, Cell, LabelList, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipCard, type TooltipRow } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { ChartContainer } from '@/components/ui/chart'
import { formatDateTooltip, formatValue } from '@/lib/format'
import type { InsightChart as ChartSpec } from '@/lib/insights'

type SeriesPoint = Extract<ChartSpec, { kind: 'series' }>['points'][number]
type BarDatum = Extract<ChartSpec, { kind: 'bars' }>['bars'][number]

/** The small chart beside each insight: a series with the key day marked, or a short bar comparison. */
export function InsightChart({ chart, label }: { chart: ChartSpec; label: string }) {
  if (chart.kind === 'bars') {
    return (
      <ChartContainer role="figure" config={{}} className="aspect-auto h-24 w-full" aria-label={label}>
        <BarChart data={chart.bars} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="label" width={64} tickLine={false} axisLine={false} tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={({ active, payload }) => {
              const bar = tooltipDatum<BarDatum>(payload)
              if (!active || !bar) return null
              return <TooltipCard title={bar.label} rows={[{ label: 'ROAS', value: formatValue(chart.format, bar.value), color: bar.color }]} />
            }}
          />
          <Bar dataKey="value" barSize={14} radius={[0, 4, 4, 0]} animationDuration={300}>
            {chart.bars.map((bar) => (
              <Cell key={bar.label} fill={bar.color} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(value) => formatValue(chart.format, typeof value === 'number' ? value : null)} className="fill-muted-foreground text-xs" />
          </Bar>
        </BarChart>
      </ChartContainer>
    )
  }

  const highlighted = chart.points.find((p) => p.date === chart.highlight)
  return (
    <ChartContainer role="figure" config={{}} className="aspect-auto h-24 w-full" aria-label={label}>
      <LineChart data={chart.points} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 20 }}
          content={({ active, payload }) => {
            const point = tooltipDatum<SeriesPoint>(payload)
            if (!active || !point) return null
            const rows: TooltipRow[] = [{ label: chart.seriesLabel, value: formatValue(chart.format, point.value), color: chart.color }]
            if (chart.referenceLabel) rows.push({ label: chart.referenceLabel, value: formatValue(chart.format, point.reference), color: 'var(--muted-foreground)', dashed: true })
            return <TooltipCard title={formatDateTooltip(point.date)} rows={rows} />
          }}
        />
        {chart.referenceLabel && <Line dataKey="reference" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} animationDuration={300} />}
        <Line dataKey="value" stroke={chart.color} strokeWidth={2} dot={false} animationDuration={300} />
        {highlighted && highlighted.value !== null && (
          <ReferenceDot x={highlighted.date} y={highlighted.value} r={5} fill={chart.color} stroke="var(--card)" strokeWidth={2} />
        )}
      </LineChart>
    </ChartContainer>
  )
}
