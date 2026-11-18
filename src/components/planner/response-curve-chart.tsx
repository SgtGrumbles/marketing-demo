import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipCard } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { channelColor, channelLabel } from '@/lib/channels'
import { formatCurrency, formatCurrencyCompact, formatMultiplier, formatPercent } from '@/lib/format'
import { roas } from '@/lib/metrics'
import { niceTicks } from '@/lib/ticks'
import { curvePoints, curveRevenue, marginalRoas, saturation, type ResponseCurve } from '@/lib/planner'

interface ResponseCurveChartProps {
  curve: ResponseCurve
  proposed: number
}

type CurvePoint = ReturnType<typeof curvePoints>[number]

/** Revenue against monthly spend for one channel, with where it sits now and where the plan puts it. */
export function ResponseCurveChart({ curve, proposed }: ResponseCurveChartProps) {
  const color = channelColor(curve.channel)
  const label = channelLabel(curve.channel)
  const current = curve.current.spend
  const yTicks = niceTicks(curveRevenue(curve, curve.maxSpend))

  return (
    <Card data-curve={curve.channel}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChannelSwatch channel={curve.channel} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border-2 border-muted-foreground bg-card" />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            Proposed
          </span>
        </div>
        <ChartContainer role="figure" config={{ revenue: { label: 'Revenue', color } }} className="aspect-auto h-44 w-full" aria-label={`${label} response curve`}>
          <LineChart data={curvePoints(curve)} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="spend" type="number" domain={[0, curve.maxSpend]} tickFormatter={formatCurrencyCompact} tickLine={false} axisLine={false} tickMargin={8} ticks={niceTicks(curve.maxSpend)} />
            <YAxis tickFormatter={formatCurrencyCompact} tickLine={false} axisLine={false} width={56} ticks={yTicks} domain={[0, 'dataMax']} />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              content={({ active, payload }) => {
                const point = tooltipDatum<CurvePoint>(payload)
                if (!active || !point) return null
                return (
                  <TooltipCard
                    title={`${formatCurrency(point.spend)} spend`}
                    rows={[{ label: 'Revenue', value: formatCurrency(point.revenue), color }]}
                    note={`ROAS ${formatMultiplier(roas(point))} · marginal ${formatMultiplier(marginalRoas(curve, point.spend))}`}
                  />
                )
              }}
            />
            <Line dataKey="revenue" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            <ReferenceDot x={current} y={curveRevenue(curve, current)} r={5} fill="var(--card)" stroke="var(--muted-foreground)" strokeWidth={2} />
            <ReferenceDot x={proposed} y={curveRevenue(curve, proposed)} r={6} fill={color} stroke="var(--card)" strokeWidth={2} data-proposed />
          </LineChart>
        </ChartContainer>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Marginal ROAS</dt>
            <dd className="font-medium tabular-nums" data-marginal>{formatMultiplier(marginalRoas(curve, proposed))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Saturation</dt>
            <dd className="font-medium tabular-nums">{formatPercent(saturation(curve, proposed))}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
