import { Bar, BarChart, Cell, LabelList, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipCard } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import type { ChannelKey } from '@/data/types'
import { channelColor, channelLabel } from '@/lib/channels'
import { formatCount, formatPercent } from '@/lib/format'
import { FUNNEL_STAGES, FUNNEL_STEPS } from '@/lib/funnel'
import { METRICS, type Totals } from '@/lib/metrics'

interface StepRow {
  key: ChannelKey
  label: string
  rate: number | null
  volume: number
}

const stageLabel = (key: string) => FUNNEL_STAGES.find((s) => s.key === key)?.label ?? key

/** Small multiples: one panel per funnel step, one bar per channel, a rule at the blended rate. */
export function ChannelStepComparison({ byChannel, channels, totals }: { byChannel: ReadonlyMap<ChannelKey, Totals>; channels: readonly ChannelKey[]; totals: Totals }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where each channel leaks</CardTitle>
        <CardDescription>Step conversion by channel; the vertical rule marks the blended rate</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {FUNNEL_STEPS.map((step) => {
          const metric = METRICS[step.metric]
          const blended = metric.compute(totals)
          const rows: StepRow[] = channels.map((key) => {
            const t = byChannel.get(key)
            return { key, label: channelLabel(key), rate: t ? metric.compute(t) : null, volume: t ? t[step.from] : 0 }
          })
          const max = Math.max(...rows.map((r) => r.rate ?? 0), blended ?? 0)
          return (
            <section key={step.metric} className="grid gap-2" data-step={step.metric}>
              <div>
                <h2 className="text-sm font-medium">{metric.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {stageLabel(step.from)} → {stageLabel(step.to)} · blended {formatPercent(blended)}
                </p>
              </div>
              <ChartContainer role="figure" config={{}} className="aspect-auto w-full" style={{ height: rows.length * 34 + 8 }} aria-label={`${metric.label} by channel`}>
                <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }} barCategoryGap={8}>
                  <XAxis type="number" hide domain={[0, max * 1.05]} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={104} tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                    content={({ active, payload }) => {
                      const row = tooltipDatum<StepRow>(payload)
                      if (!active || !row) return null
                      return (
                        <TooltipCard
                          title={row.label}
                          rows={[
                            { label: metric.label, value: formatPercent(row.rate), color: channelColor(row.key) },
                            { label: 'blended', value: formatPercent(blended), color: 'var(--muted-foreground)' },
                          ]}
                          note={`${formatCount(row.volume)} ${stageLabel(step.from).toLowerCase()}`}
                        />
                      )
                    }}
                  />
                  {blended !== null && <ReferenceLine x={blended} stroke="var(--foreground)" strokeOpacity={0.5} strokeWidth={1.5} zIndex={250} />}
                  <Bar dataKey="rate" barSize={16} radius={[0, 4, 4, 0]} animationDuration={300}>
                    {rows.map((row) => (
                      <Cell key={row.key} fill={channelColor(row.key)} />
                    ))}
                    {/* A halo in the card color keeps labels legible where they cross the blended-rate rule. */}
                    <LabelList
                      dataKey="rate"
                      position="right"
                      formatter={(value) => formatPercent(typeof value === 'number' ? value : null)}
                      className="fill-muted-foreground text-xs"
                      style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 4, strokeLinejoin: 'round' }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
