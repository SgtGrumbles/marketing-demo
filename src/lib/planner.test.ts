import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { parseCurrencyInput } from './format'
import {
  allocationTotal,
  calibrateCurve,
  curveRevenue,
  marginalRoas,
  optimizeAllocation,
  PLANNER_CHANNELS,
  plannerBaseline,
  projectPlan,
  rebalance,
} from './planner'

const baseline = plannerBaseline(getDataset())

describe('planner', () => {
  it('calibrates each curve through the last 30 days', () => {
    expect(curveRevenue(calibrateCurve(100_000, 400_000, 1), 100_000)).toBeCloseTo(400_000)
    for (const channel of PLANNER_CHANNELS) {
      const curve = baseline.curves[channel]
      expect(curveRevenue(curve, curve.current.spend)).toBeCloseTo(curve.current.revenue, 2)
    }
  })

  it('projects the current plan as the actual last 30 days', () => {
    const { rows, total } = projectPlan(baseline, baseline.allocation)
    for (const row of rows) {
      const actual = row.fixed ? baseline.fixed.find((f) => f.channel === row.channel)?.totals : baseline.curves[row.channel as 'search'].current
      expect(row.revenue).toBeCloseTo(actual?.revenue ?? NaN, 2)
      expect(row.orders).toBeCloseTo(actual?.orders ?? NaN, 6)
    }
    expect(total.revenue).toBeCloseTo(rows.reduce((sum, row) => sum + row.revenue, 0), 6)
  })

  it('gives TikTok the most headroom and Meta the least', () => {
    const marginal = (channel: (typeof PLANNER_CHANNELS)[number]) => marginalRoas(baseline.curves[channel], baseline.curves[channel].current.spend)
    expect(marginal('tiktok')).toBeGreaterThan(marginal('search'))
    expect(marginal('search')).toBeGreaterThan(marginal('meta'))
  })

  it('keeps the total when rebalancing with the lock on', () => {
    const total = allocationTotal(baseline.allocation)
    const next = rebalance(baseline, baseline.allocation, 'tiktok', 200_000, true)
    expect(next.tiktok).toBe(200_000)
    expect(allocationTotal(next)).toBeCloseTo(total, 6)
    expect(next.meta / next.search).toBeCloseTo(baseline.allocation.meta / baseline.allocation.search, 6)
  })

  it('pins channels at their maximum and caps the moved slider when the lock leaves no room', () => {
    const start = { search: 300_000, meta: 300_000, tiktok: 220_000 }
    const next = rebalance(baseline, start, 'meta', 0, true)
    expect(next.tiktok).toBe(baseline.curves.tiktok.maxSpend)
    expect(allocationTotal(next)).toBeCloseTo(820_000, 6)
    const total = allocationTotal(baseline.allocation)
    const capped = rebalance(baseline, baseline.allocation, 'search', 10_000_000, true)
    expect(capped.search).toBe(baseline.curves.search.maxSpend)
    expect(allocationTotal(capped)).toBeCloseTo(total, 6)
  })

  it('only moves one slider with the lock off', () => {
    const next = rebalance(baseline, baseline.allocation, 'meta', 100_000, false)
    expect(next).toEqual({ ...baseline.allocation, meta: 100_000 })
  })

  it('optimizes toward TikTok and away from Meta for the same total and more revenue', () => {
    const total = allocationTotal(baseline.allocation)
    const optimal = optimizeAllocation(baseline, total)
    expect(allocationTotal(optimal)).toBeCloseTo(total, 6)
    expect(optimal.tiktok).toBeGreaterThan(baseline.allocation.tiktok)
    expect(optimal.meta).toBeLessThan(baseline.allocation.meta)
    expect(projectPlan(baseline, optimal).total.revenue).toBeGreaterThan(projectPlan(baseline, baseline.allocation).total.revenue)
    const marginals = PLANNER_CHANNELS.map((channel) => marginalRoas(baseline.curves[channel], optimal[channel]))
    expect(Math.max(...marginals) - Math.min(...marginals)).toBeLessThan(0.05)
  })

  it('parses typed amounts', () => {
    expect(parseCurrencyInput('$120,500')).toBe(120_500)
    expect(parseCurrencyInput('120.5k')).toBe(120_500)
    expect(parseCurrencyInput('1.2M')).toBe(1_200_000)
    expect(parseCurrencyInput('abc')).toBeNull()
    expect(parseCurrencyInput('')).toBeNull()
  })
})
