import { describe, expect, it } from 'vitest'
import { previousRange, resolveRange } from './date-range'

const bounds = { start: '2024-06-13', end: '2025-12-04' }

describe('resolveRange', () => {
  it('ends presets on the last day with data', () => {
    expect(resolveRange('7d', bounds)).toEqual({ from: '2025-11-28', to: '2025-12-04', days: 7 })
    expect(resolveRange('30d', bounds)).toEqual({ from: '2025-11-05', to: '2025-12-04', days: 30 })
    expect(resolveRange('90d', bounds).from).toBe('2025-09-06')
  })

  it('resolves quarter and year to date', () => {
    expect(resolveRange('qtd', bounds)).toEqual({ from: '2025-10-01', to: '2025-12-04', days: 65 })
    expect(resolveRange('ytd', bounds)).toEqual({ from: '2025-01-01', to: '2025-12-04', days: 338 })
  })

  it('clamps custom ranges to the data and fixes reversed dates', () => {
    expect(resolveRange('custom', bounds, { from: '2024-01-01', to: '2024-06-20' })).toEqual({ from: '2024-06-13', to: '2024-06-20', days: 8 })
    expect(resolveRange('custom', bounds, { from: '2025-10-31', to: '2025-10-01' })).toEqual({ from: '2025-10-01', to: '2025-10-31', days: 31 })
  })

  it('falls back to 30 days for a custom range without dates', () => {
    expect(resolveRange('custom', bounds)).toEqual(resolveRange('30d', bounds))
  })
})

describe('previousRange', () => {
  it('is the equal-length period immediately before', () => {
    const range = resolveRange('30d', bounds)
    expect(previousRange(range, bounds)).toEqual({ from: '2025-10-06', to: '2025-11-04', days: 30, complete: true })
  })

  it('flags periods that start before the data', () => {
    expect(previousRange(resolveRange('ytd', bounds), bounds).complete).toBe(false)
  })
})
