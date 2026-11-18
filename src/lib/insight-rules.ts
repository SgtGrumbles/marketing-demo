import { format, parseISO } from 'date-fns'
import { holidayName } from '@/data/calendar'
import type { ChannelKey } from '@/data/types'
import { filterFacts, totalsByChannel } from '@/lib/aggregate'
import { pacingByCampaign, pacingTone } from '@/lib/campaigns'
import { CHANNELS, channelColor, channelLabel, PAID_SOCIAL_CHANNELS, SERIES_COLORS } from '@/lib/channels'
import { creativeRows } from '@/lib/creatives'
import { formatCount, formatCurrency, formatDateRange, formatDateTooltip, formatDecimal, formatMultiplier, formatPercent } from '@/lib/format'
import { ANOMALY, anomalyZ, dailyIndex, revenueResiduals, trackingGaps, type DailyIndex } from '@/lib/insight-signals'
import type { Insight, InsightChart, InsightContext } from '@/lib/insights'
import { ctr, emptyTotals, METRICS, percentChange, ratio, roas, sumTotals, type MetricKey, type SummedField, type Totals } from '@/lib/metrics'

// The six insight rules. Each returns zero or more insights for the current range and channels.

const TREND = { windowDays: 21, minChange: 0.15, minRoasChange: 0.2, minSpendShare: 0.01 } as const

function rangeIndices(index: DailyIndex, range: { from: string; to: string }): [number, number] {
  return [index.position.get(range.from) ?? 0, index.position.get(range.to) ?? index.dates.length - 1]
}

function isoWindow(index: DailyIndex, from: number, to: number) {
  const last = index.dates.length - 1
  return { from: index.dates[Math.max(0, from)] ?? '', to: index.dates[Math.min(last, to)] ?? '' }
}

/** Day-by-day totals for a set of channels between two indices (inclusive, clamped). */
function dayTotals(index: DailyIndex, channels: readonly ChannelKey[], from: number, to: number): { date: string; totals: Totals }[] {
  const result: { date: string; totals: Totals }[] = []
  for (let i = Math.max(0, from); i <= Math.min(index.dates.length - 1, to); i++) {
    result.push({ date: index.dates[i] ?? '', totals: sumTotals(channels.map((c) => index.byChannel.get(c)?.[i] ?? emptyTotals())) })
  }
  return result
}

function metricSeries(index: DailyIndex, channels: readonly ChannelKey[], metric: MetricKey, from: number, to: number, color: string, highlight?: string): InsightChart {
  const { compute, format, label } = METRICS[metric]
  return {
    kind: 'series',
    format,
    color,
    seriesLabel: label,
    highlight,
    points: dayTotals(index, channels, from, to).map(({ date, totals }) => ({ date, value: compute(totals) })),
  }
}

/** Least-squares line through the values; returns its fitted value at every position. */
function linearFit(values: readonly number[]): number[] {
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = values.reduce((sum, v) => sum + v, 0) / n
  let num = 0
  let den = 0
  values.forEach((v, x) => {
    num += (x - xMean) * (v - yMean)
    den += (x - xMean) ** 2
  })
  const slope = den ? num / den : 0
  return values.map((_, x) => yMean + slope * (x - xMean))
}

export function trackingGapInsights({ data, range, channels }: InsightContext): Insight[] {
  const index = dailyIndex(data)
  const [start, end] = rangeIndices(index, range)
  const insights: Insight[] = []
  for (const channel of channels) {
    for (const gap of trackingGaps(data).get(channel)?.values() ?? []) {
      if (gap.index < start || gap.index > end) continue
      const date = index.dates[gap.index] ?? ''
      const label = channelLabel(channel)
      insights.push({
        id: `tracking:${channel}:${date}`,
        type: 'tracking',
        severity: 'warning',
        channel,
        date,
        score: 100,
        title: `Likely tracking gap in ${label}`,
        body: `On ${formatDateTooltip(date)}, ${label} clicks were normal (${formatCount(gap.clicks)}, ${formatPercent(ratio(gap.clicks, gap.avgClicks))} of the prior week's average) but recorded orders fell to ${formatCount(gap.orders)}, ${formatPercent(ratio(gap.orders, gap.avgOrders))} of usual. That points to conversion tracking, not a drop in performance.`,
        chart: metricSeries(index, [channel], 'orders', gap.index - 10, gap.index + 5, channelColor(channel), date),
        link: { pathname: `/channels/${channel}`, range: isoWindow(index, gap.index - 14, gap.index + 7) },
      })
    }
  }
  return insights
}

export function anomalyInsights({ data, range, channels }: InsightContext): Insight[] {
  const index = dailyIndex(data)
  const [start, end] = rangeIndices(index, range)
  const insights: Insight[] = []
  for (const channel of channels) {
    const residuals = revenueResiduals(data).get(channel) ?? []
    const gaps = trackingGaps(data).get(channel)
    // Keep only the strongest anomaly per channel, so a multi-day event reads as one insight.
    let strongest: { i: number; z: number } | null = null
    for (let i = start; i <= end; i++) {
      const z = anomalyZ(residuals, i)
      const residual = residuals[i]
      if (gaps?.has(i) || z === null || residual == null) continue
      if (Math.abs(z) < ANOMALY.minZ || Math.abs(Math.exp(residual) - 1) < ANOMALY.minChange) continue
      if (!strongest || Math.abs(z) > Math.abs(strongest.z)) strongest = { i, z }
    }
    if (!strongest) continue

    const { i, z } = strongest
    const date = index.dates[i] ?? ''
    const days = index.byChannel.get(channel) ?? []
    const revenue = days[i]?.revenue ?? 0
    const trailing = days.slice(Math.max(0, i - ANOMALY.historyDays), i)
    const multiple = ratio(revenue, trailing.reduce((sum, d) => sum + d.revenue, 0) / Math.max(trailing.length, 1))
    const label = channelLabel(channel)
    const holiday = holidayName(date)
    const when = `${formatDateTooltip(date)}${holiday ? ` (${holiday})` : ''}`
    const up = z > 0
    insights.push({
      id: `anomaly:${channel}:${date}`,
      type: 'anomaly',
      severity: up ? 'info' : 'warning',
      channel,
      date,
      score: 50 + Math.min(Math.abs(z), 30),
      title: `${label} revenue ${up ? 'spike' : 'drop'}`,
      body: up
        ? `${label} brought in ${formatCurrency(revenue)} on ${when}, ${formatMultiplier(multiple)} its 28-day daily average, an unusual move against the rest of the business (z = ${formatDecimal(z)}).`
        : `${label} revenue fell to ${formatCurrency(revenue)} on ${when}, ${formatPercent(multiple)} of its 28-day daily average (z = ${formatDecimal(z)}).`,
      chart: metricSeries(index, [channel], 'revenue', i - 21, i + 5, channelColor(channel), date),
      link: { pathname: `/channels/${channel}`, range: isoWindow(index, i - 21, i + 7) },
    })
  }
  return insights
}

export function trendInsights({ data, range, channels }: InsightContext): Insight[] {
  const index = dailyIndex(data)
  const [, end] = rangeIndices(index, range)
  const start = Math.max(0, end - TREND.windowDays + 1)
  const window = isoWindow(index, start, end)
  const days = dayTotals(index, channels, start, end)
  const peak = days.some((d) => holidayName(d.date) === 'Black Friday')
  const insights: Insight[] = []

  for (const metric of ['spend', 'revenue'] as const satisfies readonly SummedField[]) {
    const values = days.map((d) => d.totals[metric])
    const fitted = linearFit(values)
    const first = fitted[0] ?? 0
    const last = fitted.at(-1) ?? 0
    const change = percentChange(last, first)
    if (change === null || Math.abs(change) < TREND.minChange) continue
    const { label } = METRICS[metric]
    insights.push({
      id: `trend:${metric}:${window.to}`,
      type: 'trend',
      severity: 'info',
      date: window.to,
      score: 30 + Math.abs(change) * 10,
      title: `${label} ${change > 0 ? 'up' : 'down'} ${formatPercent(Math.abs(change))} over three weeks`,
      body: `Daily ${label.toLowerCase()} trended from about ${formatCurrency(first)} to ${formatCurrency(last)} over ${formatDateRange(window.from, window.to)}${peak ? ', through the Black Friday–Cyber Monday peak' : ''}.`,
      chart: {
        kind: 'series',
        format: 'currency',
        color: SERIES_COLORS[metric],
        seriesLabel: label,
        referenceLabel: 'Trend',
        points: days.map((d, k) => ({ date: d.date, value: values[k] ?? null, reference: fitted[k] ?? null })),
      },
      link: { pathname: '/', range: window },
    })
  }

  // ROAS compares the first and last week of the window from summed components, not averaged daily ratios.
  const totalSpend = sumTotals(days.map((d) => d.totals)).spend
  for (const channel of channels.filter((c) => CHANNELS[c].paid)) {
    const own = dayTotals(index, [channel], start, end).map((d) => d.totals)
    if (sumTotals(own).spend < TREND.minSpendShare * totalSpend) continue
    const before = roas(sumTotals(own.slice(0, 7)))
    const after = roas(sumTotals(own.slice(-7)))
    const change = percentChange(after, before)
    if (change === null || Math.abs(change) < TREND.minRoasChange) continue
    const label = channelLabel(channel)
    insights.push({
      id: `trend:roas:${channel}:${window.to}`,
      type: 'trend',
      severity: change > 0 ? 'opportunity' : 'warning',
      channel,
      date: window.to,
      score: 35 + Math.abs(change) * 10,
      title: `${label} ROAS ${change > 0 ? 'up' : 'down'} ${formatPercent(Math.abs(change))}`,
      body: `${label} ROAS moved from ${formatMultiplier(before)} in the first week of ${formatDateRange(window.from, window.to)} to ${formatMultiplier(after)} in the latest week.`,
      chart: metricSeries(index, [channel], 'roas', start, end, channelColor(channel)),
      link: { pathname: `/channels/${channel}`, range: window },
    })
  }
  return insights
}

export function fatigueInsights({ data, range, channels }: InsightContext): Insight[] {
  const campaigns = new Map(data.campaigns.filter((c) => channels.includes(c.channel)).map((c) => [c.id, c]))
  return creativeRows(data, new Set(campaigns.keys()), range)
    .filter((row) => row.signal?.fatigued)
    .flatMap((row): Insight[] => {
      const signal = row.signal
      const channel = campaigns.get(row.campaignId)?.channel
      if (!signal || !channel) return []
      const rows = data.creativeFacts.filter((r) => r.creativeId === row.id && r.date >= signal.from && r.date <= signal.to)
      return [
        {
          id: `fatigue:${row.id}:${signal.to}`,
          type: 'fatigue',
          severity: 'warning',
          channel,
          date: signal.to,
          score: 90,
          title: `Creative fatigue: ${row.name}`,
          body: `In ${row.campaignName}, frequency rose from ${signal.frequencyFrom.toFixed(1)} to ${signal.frequencyTo.toFixed(1)} over ${formatDateRange(signal.from, signal.to)} while CTR fell ${formatPercent(Math.abs(signal.ctrChange ?? 0))} and CPA rose ${formatPercent(signal.cpaChange)}. Time to refresh or rotate it.`,
          chart: { kind: 'series', format: 'percent', color: channelColor(channel), seriesLabel: 'CTR', points: rows.map((r) => ({ date: r.date, value: ctr(r) })) },
          link: { pathname: `/channels/${channel}`, campaign: row.campaignId },
        },
      ]
    })
}

export function pacingInsights({ data, channels }: InsightContext): Insight[] {
  const pacing = pacingByCampaign(data)
  const monthStart = `${data.endDate.slice(0, 8)}01`
  const month = format(parseISO(data.endDate), 'MMMM')
  return data.campaigns.flatMap((campaign): Insight[] => {
    const p = pacing.get(campaign.id)
    if (!p || !channels.includes(campaign.channel) || pacingTone(p.pacing) !== 'over') return []
    let spent = 0
    const points = data.facts
      .filter((f) => f.campaignId === campaign.id && f.date >= monthStart)
      .map((f, k) => {
        spent += f.spend
        return { date: f.date, value: spent, reference: (p.budget * (k + 1)) / p.daysInMonth }
      })
    return [
      {
        id: `pacing:${campaign.id}:${data.endDate}`,
        type: 'pacing',
        severity: 'warning',
        channel: campaign.channel,
        date: data.endDate,
        score: 80,
        title: `${campaign.name} is pacing over budget`,
        body: `Month-to-date spend is ${formatCurrency(p.monthToDate)}, ${formatPercent(p.pacing)} of plan with ${formatPercent(p.expectedShare)} of ${month} gone. At this rate it ends the month at ${formatCurrency(p.projected)} against a ${formatCurrency(p.budget)} budget.`,
        chart: { kind: 'series', format: 'currency', color: channelColor(campaign.channel), seriesLabel: 'Spent', referenceLabel: 'Plan', points },
        link: { pathname: '/campaigns', campaign: campaign.id },
      },
    ]
  })
}

export function efficiencyInsights({ data, range, channels }: InsightContext): Insight[] {
  const social = PAID_SOCIAL_CHANNELS.filter((c) => channels.includes(c))
  const byChannel = totalsByChannel(filterFacts(data.facts, range, social))
  const ranked = social
    .map((channel) => ({ channel, totals: byChannel.get(channel) ?? emptyTotals() }))
    .filter((c) => c.totals.spend > 0)
    .map((c) => ({ ...c, roas: roas(c.totals) ?? 0 }))
    .sort((a, b) => b.roas - a.roas)
  const [leader, ...rest] = ranked
  if (!leader || rest.length === 0) return []

  const share = ratio(leader.totals.spend, sumTotals(ranked.map((c) => c.totals)).spend) ?? 0
  const label = channelLabel(leader.channel)
  const others = rest.map((c) => `${formatMultiplier(c.roas)} for ${channelLabel(c.channel)}`).join(' and ')
  return [
    {
      id: `efficiency:${leader.channel}:${range.from}:${range.to}`,
      type: 'efficiency',
      severity: 'opportunity',
      channel: leader.channel,
      score: 70,
      title: `${label} is the most efficient paid social channel`,
      body: `${label} returned ${formatMultiplier(leader.roas)} ROAS over ${formatDateRange(range.from, range.to)}, against ${others}, on ${share < 0.5 ? 'just ' : ''}${formatPercent(share)} of paid social spend. It has the most room to scale.`,
      chart: { kind: 'bars', format: 'multiplier', bars: ranked.map((c) => ({ label: channelLabel(c.channel), value: c.roas, color: channelColor(c.channel) })) },
      link: { pathname: `/channels/${leader.channel}` },
    },
  ]
}
