import { differenceInCalendarDays, parseISO, startOfQuarter, startOfYear, subDays } from 'date-fns'
import { toISODate } from '@/data/calendar'
import type { Dataset } from '@/data/types'

export type RangePreset = '7d' | '30d' | '90d' | 'qtd' | 'ytd' | 'custom'

export type QuickPreset = Exclude<RangePreset, 'custom'>

/** Presets that resolve without extra input, in menu order. */
export const QUICK_PRESETS: readonly { key: QuickPreset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'qtd', label: 'Quarter to date' },
  { key: 'ytd', label: 'Year to date' },
]

export const RANGE_PRESETS: readonly { key: RangePreset; label: string }[] = [...QUICK_PRESETS, { key: 'custom', label: 'Custom' }]

export function isRangePreset(value: string): value is RangePreset {
  return RANGE_PRESETS.some((preset) => preset.key === value)
}

export function presetLabel(preset: RangePreset): string {
  return RANGE_PRESETS.find((p) => p.key === preset)?.label ?? 'Custom'
}

/** Inclusive range of ISO dates. */
export interface DateRange {
  from: string
  to: string
  days: number
}

export interface PreviousRange extends DateRange {
  /** False when the previous period starts before the data does, so deltas would compare unequal spans. */
  complete: boolean
}

/** First and last dates with data. "Today" is the day after `end`. */
export interface DataBounds {
  start: string
  end: string
}

export function dataBounds(data: Pick<Dataset, 'startDate' | 'endDate'>): DataBounds {
  return { start: data.startDate, end: data.endDate }
}

function makeRange(from: string, to: string): DateRange {
  return { from, to, days: differenceInCalendarDays(parseISO(to), parseISO(from)) + 1 }
}

const clamp = (iso: string, bounds: DataBounds) => (iso < bounds.start ? bounds.start : iso > bounds.end ? bounds.end : iso)

/** Resolves a preset (or custom from/to) to concrete dates. Presets end on the last day with data. */
export function resolveRange(preset: RangePreset, bounds: DataBounds, custom?: { from: string; to: string }): DateRange {
  const end = parseISO(bounds.end)
  const lastDays = (n: number) => toISODate(subDays(end, n - 1))

  let from: string
  let to = bounds.end
  switch (preset) {
    case '7d':
      from = lastDays(7)
      break
    case '30d':
      from = lastDays(30)
      break
    case '90d':
      from = lastDays(90)
      break
    case 'qtd':
      from = toISODate(startOfQuarter(end))
      break
    case 'ytd':
      from = toISODate(startOfYear(end))
      break
    case 'custom':
      if (!custom) return resolveRange('30d', bounds)
      from = custom.from
      to = custom.to
      break
  }
  from = clamp(from, bounds)
  to = clamp(to, bounds)
  return from <= to ? makeRange(from, to) : makeRange(to, from)
}

/** The equal-length period immediately before `range`. */
export function previousRange(range: DateRange, bounds: DataBounds): PreviousRange {
  const to = subDays(parseISO(range.from), 1)
  const from = toISODate(subDays(to, range.days - 1))
  return { from, to: toISODate(to), days: range.days, complete: from >= bounds.start }
}
