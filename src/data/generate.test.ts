import { describe, expect, it } from 'vitest'
import { sumTotals } from '@/lib/metrics'
import { blackFriday } from './calendar'
import { generateDataset, getDataset } from './generate'

// data:check covers totals and storylines in depth; these guard the invariants the UI relies on.
describe('generateDataset', () => {
  const data = getDataset()

  it('is memoized and deterministic', () => {
    expect(getDataset()).toBe(data)
    expect(generateDataset()).toEqual(data)
  })

  it('covers 540 days ending the day before asOfDate', () => {
    expect(data.startDate).toBe('2024-06-13')
    expect(data.endDate).toBe('2025-12-04')
  })

  it('keeps every funnel monotonic with integer counts', () => {
    for (const f of data.facts) {
      expect(f.impressions >= f.clicks && f.clicks >= f.sessions && f.sessions >= f.addToCarts && f.addToCarts >= f.orders).toBe(true)
      expect(Number.isInteger(f.orders) && Number.isInteger(f.clicks)).toBe(true)
    }
  })

  it('reconciles creative rows with their campaign rows', () => {
    const campaignOf = new Map(data.creatives.map((c) => [c.id, c.campaignId]))
    const fact = data.facts.find((f) => f.campaignId === 'meta-lookalike' && f.date === data.endDate)
    const rows = data.creativeFacts.filter((r) => r.date === data.endDate && campaignOf.get(r.creativeId) === 'meta-lookalike')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.reduce((s, r) => s + r.clicks, 0)).toBe(fact?.clicks)
    expect(rows.reduce((s, r) => s + r.spend, 0)).toBeCloseTo(fact?.spend ?? 0, 2)
  })

  it('has no rows after a campaign stops', () => {
    for (const campaign of data.campaigns.filter((c) => c.endDate)) {
      expect(data.facts.some((f) => f.campaignId === campaign.id && f.date > (campaign.endDate ?? ''))).toBe(false)
    }
  })

  it('peaks on the real Black Friday', () => {
    expect(blackFriday(2025).toDateString()).toBe(new Date(2025, 10, 28).toDateString())
    expect(blackFriday(2024).toDateString()).toBe(new Date(2024, 10, 29).toDateString())
    const spendOn = (date: string) => sumTotals(data.facts.filter((f) => f.date === date)).spend
    expect(spendOn('2025-11-28')).toBeGreaterThan(2 * spendOn('2025-09-17'))
  })
})
