import { Bar, BarChart, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipCard } from '@/components/charts/tooltip-card'
import { tooltipDatum } from '@/components/charts/tooltip-datum'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { channelColor } from '@/lib/channels'
import { formatCurrency, formatPercent } from '@/lib/format'
import { channelRows, type ChannelRow } from '@/lib/summaries'
import { useFilteredData } from '@/store/use-filtered-data'

export function SpendMix() {
  const { facts, filters } = useFilteredData()
  const rows = channelRows(facts, filters.channels)
  const paid = rows.filter((row) => row.spend > 0).sort((a, b) => b.spend - a.spend)
  const unpaid = rows.filter((row) => row.spend === 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend mix</CardTitle>
        <CardDescription>Share of spend by channel</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="aspect-auto w-full" style={{ height: Math.max(paid.length, 1) * 44 }} aria-label="Share of spend by channel">
          <BarChart data={paid} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={10}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={104} tick={{ fill: 'var(--foreground)', fontSize: 13 }} />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              content={({ active, payload }) => {
                const row = tooltipDatum<ChannelRow>(payload)
                if (!active || !row) return null
                return (
                  <TooltipCard
                    title={row.label}
                    rows={[
                      { label: 'spend', value: formatCurrency(row.spend), color: channelColor(row.key) },
                      { label: 'of spend', value: formatPercent(row.spendShare), color: channelColor(row.key) },
                      { label: 'of revenue', value: formatPercent(row.revenueShare), color: channelColor(row.key) },
                    ]}
                  />
                )
              }}
            />
            <Bar dataKey="spendShare" barSize={20} radius={[0, 4, 4, 0]} animationDuration={300}>
              {paid.map((row) => (
                <Cell key={row.key} fill={channelColor(row.key)} />
              ))}
              <LabelList dataKey="spendShare" position="right" formatter={(value) => formatPercent(typeof value === 'number' ? value : null)} className="fill-muted-foreground text-xs" />
            </Bar>
          </BarChart>
        </ChartContainer>
        {unpaid.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">{unpaid.map((row) => row.label).join(', ')}: no media spend</p>
        )}
      </CardContent>
    </Card>
  )
}
