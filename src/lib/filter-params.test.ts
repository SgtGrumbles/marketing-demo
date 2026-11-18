import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, filterSearch, hasCanonicalFilters, parseFilters, writeFilters, type Filters } from './filter-params'

const parse = (query: string) => parseFilters(new URLSearchParams(query))

describe('filter params', () => {
  it('uses defaults for an empty query and leaves them out of the URL', () => {
    expect(parse('')).toEqual(DEFAULT_FILTERS)
    expect(filterSearch(DEFAULT_FILTERS)).toBe('')
  })

  it('round-trips every field', () => {
    const filters: Filters = { range: 'custom', from: '2025-10-01', to: '2025-10-31', compare: false, channels: ['meta', 'tiktok'] }
    expect(parse(writeFilters(filters).toString())).toEqual(filters)
    expect(filterSearch(filters)).toBe('?range=custom&from=2025-10-01&to=2025-10-31&channels=meta%2Ctiktok&compare=0')
  })

  it('ignores invalid values', () => {
    expect(parse('range=lastweek&channels=meta,myspace&compare=maybe')).toEqual({ ...DEFAULT_FILTERS, channels: ['meta'] })
    expect(parse('range=custom&from=2025-13-40&to=2025-10-31').range).toBe('30d')
    expect(parse('channels=').channels).toEqual(DEFAULT_FILTERS.channels)
  })

  it('normalizes channel order and duplicates', () => {
    expect(parse('channels=tiktok,search,tiktok').channels).toEqual(['search', 'tiktok'])
  })

  it('keeps unrelated params', () => {
    const params = writeFilters({ ...DEFAULT_FILTERS, range: '7d' }, new URLSearchParams('campaign=meta-lookalike&range=90d'))
    expect(params.toString()).toBe('campaign=meta-lookalike&range=7d')
  })

  it('recognizes canonical filter params, ignoring unrelated ones', () => {
    const sevenDays = { ...DEFAULT_FILTERS, range: '7d' } as const
    expect(hasCanonicalFilters(new URLSearchParams('campaign=meta-lookalike&range=7d'), sevenDays)).toBe(true)
    expect(hasCanonicalFilters(new URLSearchParams('range=bogus'), DEFAULT_FILTERS)).toBe(false)
    expect(hasCanonicalFilters(new URLSearchParams('range=30d'), DEFAULT_FILTERS)).toBe(false)
  })
})
