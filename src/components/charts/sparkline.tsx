import { Line, LineChart, Tooltip, YAxis } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { formatDateTooltip, formatValue, type ValueFormat } from '@/lib/format'
import { TooltipCard } from './tooltip-card'
import { tooltipDatum } from './tooltip-datum'

interface SparkPoint {
  date: string
  value: number | null
}

export function Sparkline({ data, label, format, color }: { data: readonly SparkPoint[]; label: string; format: ValueFormat; color: string }) {
  return (
    <ChartContainer config={{ value: { label, color } }} className="aspect-auto h-10 w-full" aria-label={`${label} trend`}>
      <LineChart data={[...data]} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 20 }}
          content={({ active, payload }) => {
            const point = tooltipDatum<SparkPoint>(payload)
            if (!active || !point) return null
            return <TooltipCard title={formatDateTooltip(point.date)} rows={[{ label, value: formatValue(format, point.value), color }]} />
          }}
        />
        <Line dataKey="value" stroke={color} strokeWidth={2} dot={false} connectNulls animationDuration={300} />
      </LineChart>
    </ChartContainer>
  )
}
