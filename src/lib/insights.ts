import type { ChannelKey, Dataset } from '@/data/types'
import type { DateRange } from '@/lib/date-range'
import { filterSearch, type Filters } from '@/lib/filter-params'
import type { ValueFormat } from '@/lib/format'
import { anomalyInsights, efficiencyInsights, fatigueInsights, pacingInsights, trackingGapInsights, trendInsights } from '@/lib/insight-rules'

// Rule-based insight detection: six rules over the filtered data, written up with templates.
// It reads like AI, but it's plain arithmetic: every number in the text comes from the data.

export type InsightType = 'tracking' | 'fatigue' | 'pacing' | 'efficiency' | 'anomaly' | 'trend'
export type Severity = 'warning' | 'opportunity' | 'info'

export const INSIGHT_TYPES: readonly { key: InsightType; label: string }[] = [
  { key: 'anomaly', label: 'Anomaly' },
  { key: 'trend', label: 'Trend' },
  { key: 'fatigue', label: 'Creative fatigue' },
  { key: 'tracking', label: 'Tracking gap' },
  { key: 'pacing', label: 'Pacing' },
  { key: 'efficiency', label: 'Efficiency leader' },
]

export type InsightChart =
  | {
      kind: 'series'
      format: ValueFormat
      color: string
      points: { date: string; value: number | null; reference?: number | null }[]
      /** A day to mark with a dot. */
      highlight?: string
      seriesLabel: string
      referenceLabel?: string
    }
  | { kind: 'bars'; format: ValueFormat; bars: { label: string; value: number | null; color: string }[] }

/** Where "View" goes. Overrides are applied on top of the current filters. */
export interface InsightLink {
  pathname: string
  range?: { from: string; to: string }
  channels?: readonly ChannelKey[]
  campaign?: string
}

export interface Insight {
  id: string
  type: InsightType
  severity: Severity
  title: string
  /** One sentence with the real numbers. */
  body: string
  channel?: ChannelKey
  date?: string
  /** Higher ranks first within a severity. */
  score: number
  chart: InsightChart
  link: InsightLink
}

export interface InsightContext {
  data: Dataset
  range: DateRange
  channels: readonly ChannelKey[]
}

const SEVERITY_ORDER: Record<Severity, number> = { warning: 0, opportunity: 1, info: 2 }

/** All insights for the current filters, most important first. */
export function detectInsights(context: InsightContext): Insight[] {
  return [
    ...trackingGapInsights(context),
    ...fatigueInsights(context),
    ...pacingInsights(context),
    ...efficiencyInsights(context),
    ...anomalyInsights(context),
    ...trendInsights(context),
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.score - a.score)
}

/** The URL for an insight's "View": its page, with its range or channels laid over the current filters. */
export function insightHref(link: InsightLink, filters: Filters): string {
  const next: Filters = {
    ...filters,
    ...(link.range && { range: 'custom', from: link.range.from, to: link.range.to }),
    ...(link.channels && { channels: link.channels }),
  }
  const params = new URLSearchParams(filterSearch(next))
  if (link.campaign) params.set('campaign', link.campaign)
  const query = params.toString()
  return `${link.pathname}${query ? `?${query}` : ''}`
}
