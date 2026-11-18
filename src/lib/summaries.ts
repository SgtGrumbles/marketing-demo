import type { ChannelKey, DailyFact } from '@/data/types'
import { totalsByChannel, type Granularity, type SeriesPoint } from '@/lib/aggregate'
import { CHANNELS } from '@/lib/channels'
import type { DateRange, PreviousRange } from '@/lib/date-range'
import type { ValueFormat } from '@/lib/format'
import { deltaTone, METRICS, percentChange, ratio, sumTotals, type DeltaTone, type MetricKey, type Totals } from '@/lib/metrics'

// View-model builders: turn filtered facts into exactly what a widget renders. All math goes
// through lib/metrics.ts; components only format and draw.

/** Daily points get noisy past about three months. */
export function defaultGranularity(range: DateRange): Granularity {
  return range.days > 90 ? 'weekly' : 'daily'
}

/** Whether deltas can be shown: compare is on and the previous period is fully inside the data. */
export type Comparison = 'on' | 'off' | 'incomplete'

export function comparisonState(compare: boolean, previous: PreviousRange): Comparison {
  if (!compare) return 'off'
  return previous.complete ? 'on' : 'incomplete'
}

export interface KpiSummary {
  key: MetricKey
  label: string
  format: ValueFormat
  value: number | null
  /** Null unless comparison is "on". */
  change: number | null
  tone: DeltaTone
  trend: { date: string; value: number | null }[]
}

export function kpiSummary(key: MetricKey, totals: Totals, previousTotals: Totals, comparison: Comparison, points: readonly SeriesPoint[]): KpiSummary {
  const metric = METRICS[key]
  const value = metric.compute(totals)
  const change = comparison === 'on' ? percentChange(value, metric.compute(previousTotals)) : null
  return {
    key,
    label: metric.label,
    format: metric.format,
    value,
    change,
    tone: deltaTone(metric.goodDirection, change),
    trend: points.map((point) => ({ date: point.date, value: metric.compute(point) })),
  }
}

export interface TrendPoint {
  date: string
  days: number
  spend: number
  revenue: number
  previousDate?: string
  previousSpend?: number
  previousRevenue?: number
}

/** Current and previous series aligned by position: day 1 against day 1, week 1 against week 1. */
export function spendRevenueTrend(current: readonly SeriesPoint[], previous: readonly SeriesPoint[] | null): TrendPoint[] {
  return current.map((point, index) => {
    const prior = previous?.[index]
    return {
      date: point.date,
      days: point.days,
      spend: point.spend,
      revenue: point.revenue,
      ...(prior && { previousDate: prior.date, previousSpend: prior.spend, previousRevenue: prior.revenue }),
    }
  })
}

export interface ChannelRow {
  key: ChannelKey
  label: string
  spend: number
  revenue: number
  roas: number | null
  cpa: number | null
  cvr: number | null
  spendShare: number | null
  revenueShare: number | null
}

/** One row per selected channel (including ones with no activity), in channel order. */
export function channelRows(facts: readonly DailyFact[], channels: readonly ChannelKey[]): ChannelRow[] {
  const byChannel = totalsByChannel(facts)
  const total = sumTotals(byChannel.values())
  return channels.map((key) => {
    const t = byChannel.get(key) ?? sumTotals([])
    return {
      key,
      label: CHANNELS[key].label,
      spend: t.spend,
      revenue: t.revenue,
      roas: METRICS.roas.compute(t),
      cpa: METRICS.cpa.compute(t),
      cvr: METRICS.cvr.compute(t),
      spendShare: ratio(t.spend, total.spend),
      revenueShare: ratio(t.revenue, total.revenue),
    }
  })
}
