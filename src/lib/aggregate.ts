import { eachDayOfInterval, parseISO, startOfWeek } from 'date-fns'
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
  /** The day, or the first day of the week (Monday) for weekly series. */
  date: string
}

/** One point per day in the range, with zeros for days without data. */
export function dailySeries(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>): SeriesPoint[] {
  const byDate = groupTotals(facts, (f) => f.date)
  return eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) }).map((day) => {
    const date = toISODate(day)
    return { date, ...(byDate.get(date) ?? emptyTotals()) }
  })
}

/** Monday-start weeks. The first and last weeks may be partial when the range doesn't align. */
export function weeklySeries(facts: readonly DailyFact[], range: Pick<DateRange, 'from' | 'to'>): SeriesPoint[] {
  const weeks = new Map<string, SeriesPoint>()
  for (const day of dailySeries(facts, range)) {
    const week = toISODate(startOfWeek(parseISO(day.date), { weekStartsOn: 1 }))
    const point = weeks.get(week)
    if (point) addInto(point, day)
    else weeks.set(week, { ...day, date: week })
  }
  return [...weeks.values()]
}
