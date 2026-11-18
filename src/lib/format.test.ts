import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatCurrency,
  formatCurrencyCompact,
  formatDateAxis,
  formatDateRange,
  formatDateTooltip,
  formatPeriod,
  formatDelta,
  formatMultiplier,
  formatPercent,
  formatTimeAgo,
  formatUnitCost,
  formatValue,
  MISSING,
} from './format'

// Examples from the number formatting table in docs/DESIGN.md.
describe('format', () => {
  it('compact currency', () => {
    expect(formatCurrencyCompact(1_200_000)).toBe('$1.2M')
    expect(formatCurrencyCompact(84_312)).toBe('$84.3K')
    expect(formatCurrencyCompact(912.4)).toBe('$912')
    expect(formatCurrencyCompact(999.7)).toBe('$1K')
    expect(formatCurrencyCompact(999_960)).toBe('$1M')
  })

  it('full currency, unit cost, percent, multiplier, count', () => {
    expect(formatCurrency(84_312.49)).toBe('$84,312')
    expect(formatUnitCost(1.234)).toBe('$1.23')
    expect(formatPercent(0.034)).toBe('3.4%')
    expect(formatMultiplier(3.2)).toBe('3.2x')
    expect(formatCount(12_345)).toBe('12,345')
  })

  it('deltas use a sign and a true minus', () => {
    expect(formatDelta(0.124)).toBe('+12.4%')
    expect(formatDelta(-0.031)).toBe('−3.1%')
    expect(formatDelta(0.00001)).toBe('0.0%')
  })

  it('dates', () => {
    expect(formatDateAxis('2026-11-17')).toBe('Nov 17')
    expect(formatDateTooltip('2026-11-17')).toBe('Nov 17, 2026')
    expect(formatDateRange('2025-11-05', '2025-12-04')).toBe('Nov 5 – Dec 4, 2025')
    expect(formatDateRange('2024-12-28', '2025-01-03')).toBe('Dec 28, 2024 – Jan 3, 2025')
    expect(formatDateRange('2025-12-04', '2025-12-04')).toBe('Dec 4, 2025')
    expect(formatPeriod('2025-11-28', 7)).toBe('Nov 28 – Dec 4, 2025')
    expect(formatPeriod('2025-11-28', 1)).toBe('Nov 28, 2025')
  })

  it('missing and divide-by-zero values show a dash', () => {
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formatPercent(value)).toBe(MISSING)
      expect(formatValue('multiplier', value)).toBe(MISSING)
      expect(formatCurrencyCompact(value)).toBe(MISSING)
    }
  })

  it('dispatches by value format', () => {
    expect(formatValue('currency', 84_312, { compact: true })).toBe('$84.3K')
    expect(formatValue('count', 12_345, { compact: true })).toBe('12.3K')
    expect(formatValue('unitCost', 24.1)).toBe('$24.10')
  })

  it('time ago', () => {
    const now = new Date('2026-11-17T12:00:00')
    expect(formatTimeAgo(new Date('2026-11-17T11:56:00'), now)).toBe('4 min ago')
    expect(formatTimeAgo(now, now)).toBe('just now')
  })
})
