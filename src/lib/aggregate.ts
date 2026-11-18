import { eachDayOfInterval, parseISO } from 'date-fns'
import { toISODate } from '@/data/calendar'
import type { ChannelKey, DailyFact } from '@/data/types'
import type { DateRange } from '@/lib/date-range'
import { emptyTotals, SUMMED_FIELDS, type Totals } from '@/lib/metrics'

// Filtering and grouping of daily facts. Groups hold summed components only; ratios are
// computed afterwards with lib/metrics.ts.

export function filterFacts(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>, channels: readonly ChannelKey[]): DailyFact[] {
  const allowed = new Set(channels)
  return facts.filter((f) => f.date >= range.from && f.date <= range.to && allowed.has(f.channel))
}

function addInto(target: Totals, row: Totals): void {
  for (const field of SUMMED_FIELDS) target[field] += row[field]
}

export function groupTotals<K>(facts: readonly DailyFact[], keyOf: (fact: DailyFact) => K): Map<K, Totals> {
  const groups = new Map<K, Totals>()
  for (const fact of facts) {
    const key = keyOf(fact)
    let totals = groups.get(key)
    if (!totals) {
      totals = emptyTotals()
      groups.set(key, totals)
    }
    addInto(totals, fact)
  }
  return groups
}

export function totalsByChannel(facts: readonly DailyFact[]): Map<ChannelKey, Totals> {
  return groupTotals(facts, (f) => f.channel)
}

export function totalsByCampaign(facts: readonly DailyFact[]): Map<string, Totals> {
  return groupTotals(facts, (f) => f.campaignId)
}

export interface SeriesPoint extends Totals {
  /** The day, or the first day of a weekly bucket. */
  date: string
  /** Days covered: 1 for daily points, up to 7 for weekly buckets. */
  days: number
}

export type Granularity = 'daily' | 'weekly'

/** One point per day in the range, with zeros for days without data. */
export function dailySeries(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>): SeriesPoint[] {
  const byDate = groupTotals(facts, (f) => f.date)
  return eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) }).map((day) => {
    const date = toISODate(day)
    return { date, days: 1, ...(byDate.get(date) ?? emptyTotals()) }
  })
}

/**
 * 7-day buckets counted back from the range's last day, so the latest point is always a full week
 * and a previous period of the same length buckets identically. Only the oldest bucket can be short.
 */
export function weeklySeries(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>): SeriesPoint[] {
  const days = dailySeries(facts, range)
  const buckets: SeriesPoint[] = []
  for (let end = days.length; end > 0; end -= 7) {
    const chunk = days.slice(Math.max(0, end - 7), end)
    const [first] = chunk
    if (!first) continue
    const bucket: SeriesPoint = { ...emptyTotals(), date: first.date, days: chunk.length }
    for (const day of chunk) addInto(bucket, day)
    buckets.unshift(bucket)
  }
  return buckets
}

export function series(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>, granularity: Granularity): SeriesPoint[] {
  return granularity === 'daily' ? dailySeries(facts, range) : weeklySeries(facts, range)
}
