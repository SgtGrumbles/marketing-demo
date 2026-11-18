import { Line, LineChart, Tooltip, YAxis } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { formatDateTooltip, formatValue, type ValueFormat } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TooltipCard } from './tooltip-card'
import { tooltipDatum } from './tooltip-datum'

interface SparkPoint {
  date: string
  value: number | null
}

interface SparklineProps {
  data: readonly SparkPoint[]
  label: string
  format: ValueFormat
  color: string
  className?: string
  /** "left" keeps the tooltip inside scrolling containers such as tables. */
  tooltipSide?: 'below' | 'left'
}

export function Sparkline({ data, label, format, color, className, tooltipSide = 'below' }: SparklineProps) {
  return (
    <ChartContainer config={{ value: { label, color } }} className={cn('aspect-auto h-10 w-full', className)} aria-label={`${label} trend`}>
      <LineChart data={[...data]} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          allowEscapeViewBox={{ x: true, y: true }}
          position={tooltipSide === 'left' ? { x: -184, y: -12 } : undefined}
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
