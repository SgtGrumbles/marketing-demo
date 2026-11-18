import { isValid, parseISO } from 'date-fns'
import { CHANNEL_KEYS, type ChannelKey } from '@/data/types'
import { isRangePreset, type RangePreset } from '@/lib/date-range'

// Global filters and their query-string form. Defaults are left out of the URL to keep links short:
//   /campaigns?range=custom&from=2025-10-01&to=2025-10-31&channels=meta,tiktok&compare=0

export interface Filters {
  range: RangePreset
  /** Only used when range is "custom". */
  from?: string
  to?: string
  compare: boolean
  /** Never empty; all channels when unfiltered. Always in canonical channel order. */
  channels: readonly ChannelKey[]
}

export const DEFAULT_FILTERS: Filters = { range: '30d', compare: true, channels: CHANNEL_KEYS }

const FILTER_KEYS = ['range', 'from', 'to', 'compare', 'channels'] as const

const isISODate = (value: string | null): value is string =>
  value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))

const isChannelKey = (value: string): value is ChannelKey => (CHANNEL_KEYS as readonly string[]).includes(value)

/** Puts channels in canonical order without duplicates; an empty selection means all channels. */
export function normalizeChannels(channels: readonly string[]): readonly ChannelKey[] {
  const picked = CHANNEL_KEYS.filter((key) => channels.includes(key))
  return picked.length ? picked : CHANNEL_KEYS
}

/** Reads filters from a query string. Anything invalid falls back to its default. */
export function parseFilters(params: URLSearchParams): Filters {
  const rawRange = params.get('range') ?? DEFAULT_FILTERS.range
  let range: RangePreset = isRangePreset(rawRange) ? rawRange : DEFAULT_FILTERS.range
  const from = params.get('from')
  const to = params.get('to')

  const channels = normalizeChannels((params.get('channels') ?? '').split(',').filter(isChannelKey))
  const compare = params.get('compare') !== '0'

  if (range === 'custom') {
    if (isISODate(from) && isISODate(to)) return { range, from, to, compare, channels }
    range = DEFAULT_FILTERS.range
  }
  return { range, compare, channels }
}

/** Writes filters into a copy of `base`, keeping any unrelated params. */
export function writeFilters(filters: Filters, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(base)
  for (const key of FILTER_KEYS) params.delete(key)

  if (filters.range !== DEFAULT_FILTERS.range) params.set('range', filters.range)
  if (filters.range === 'custom' && filters.from && filters.to) {
    params.set('from', filters.from)
    params.set('to', filters.to)
  }
  if (filters.channels.length < CHANNEL_KEYS.length) params.set('channels', filters.channels.join(','))
  if (!filters.compare) params.set('compare', '0')
  return params
}

/** "?range=7d&channels=meta" or "" — for links that should keep the current filters. */
export function filterSearch(filters: Filters): string {
  const query = writeFilters(filters).toString()
  return query ? `?${query}` : ''
}

export function sameFilters(a: Filters, b: Filters): boolean {
  return writeFilters(a).toString() === writeFilters(b).toString()
}
