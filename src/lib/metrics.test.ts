import { describe, expect, it } from 'vitest'
import { budgetPacing, cpa, cpc, cpm, ctr, cvr, deltaTone, emptyTotals, mer, METRICS, percentChange, roas, sumTotals } from './metrics'

const day = (overrides: Partial<ReturnType<typeof emptyTotals>>) => ({ ...emptyTotals(), ...overrides })

describe('ratios', () => {
  const totals = day({ impressions: 10_000, clicks: 340, spend: 418.2, sessions: 300, orders: 12, revenue: 1338.24, newCustomers: 6 })

  it('match the DATA.md definitions', () => {
    expect(ctr(totals)).toBeCloseTo(0.034)
    expect(cpc(totals)).toBeCloseTo(1.23)
    expect(cpm(totals)).toBeCloseTo(41.82)
    expect(cvr(totals)).toBeCloseTo(0.04)
    expect(cpa(totals)).toBeCloseTo(34.85)
    expect(roas(totals)).toBeCloseTo(3.2)
    expect(METRICS.aov.compute(totals)).toBeCloseTo(111.52)
    expect(METRICS.cac.compute(totals)).toBeCloseTo(69.7)
  })

  it('return null for a zero denominator', () => {
    const empty = emptyTotals()
    for (const metric of Object.values(METRICS)) {
      if (metric.format !== 'currency' && metric.format !== 'count') expect(metric.compute(empty)).toBeNull()
    }
  })

  it('are computed from sums, not averaged daily ratios', () => {
    const days = [day({ clicks: 1, impressions: 10 }), day({ clicks: 99, impressions: 9_990 })]
    // Averaging daily CTRs would give (10% + ~1%) / 2 ≈ 5.5%; the true CTR is 100 / 10,000.
    expect(ctr(sumTotals(days))).toBeCloseTo(0.01)
  })

  it('MER uses all-channel revenue over all-channel spend', () => {
    const paid = day({ spend: 1000, revenue: 3000 })
    const organic = day({ spend: 0, revenue: 800 })
    expect(mer(sumTotals([paid, organic]))).toBeCloseTo(3.8)
  })
})

describe('deltas', () => {
  it('computes percent change against the previous value', () => {
    expect(percentChange(112.4, 100)).toBeCloseTo(0.124)
    expect(percentChange(5, 0)).toBeNull()
    expect(percentChange(null, 4)).toBeNull()
  })

  it('colors by good direction', () => {
    expect(deltaTone(METRICS.revenue.goodDirection, 0.1)).toBe('good')
    expect(deltaTone(METRICS.cpa.goodDirection, -0.1)).toBe('good')
    expect(deltaTone(METRICS.cpa.goodDirection, 0.1)).toBe('bad')
    expect(deltaTone(METRICS.spend.goodDirection, 0.5)).toBe('neutral')
    expect(deltaTone(METRICS.roas.goodDirection, null)).toBe('neutral')
  })
})

describe('budgetPacing', () => {
  it('compares month-to-date spend with a straight-line share of budget', () => {
    expect(budgetPacing(11_500, 30_000, 10, 30)).toBeCloseTo(1.15)
    expect(budgetPacing(100, 0, 10, 30)).toBeNull()
  })
})
