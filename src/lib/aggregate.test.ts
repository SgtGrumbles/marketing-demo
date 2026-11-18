import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { CHANNEL_KEYS } from '@/data/types'
import { dailySeries, filterFacts, totalsByChannel, totalsByCampaign, weeklySeries } from './aggregate'
import { resolveRange } from './date-range'
import { sumTotals } from './metrics'

const data = getDataset()
const bounds = { start: data.startDate, end: data.endDate }

describe('aggregation', () => {
  const range = resolveRange('90d', bounds)
  const facts = filterFacts(data.facts, range, CHANNEL_KEYS)
  const total = sumTotals(facts)

  it('filters by date and channel', () => {
    const paidSocial = filterFacts(data.facts, range, ['meta', 'tiktok'])
    expect(paidSocial.every((f) => (f.channel === 'meta' || f.channel === 'tiktok') && f.date >= range.from && f.date <= range.to)).toBe(true)
    expect(paidSocial.length).toBeLessThan(facts.length)
  })

  it('breakdowns reconcile with the total', () => {
    for (const groups of [totalsByChannel(facts), totalsByCampaign(facts)]) {
      const regrouped = sumTotals(groups.values())
      expect(regrouped.orders).toBe(total.orders)
      expect(regrouped.revenue).toBeCloseTo(total.revenue, 2)
    }
  })

  it('daily series has one point per day and sums to the total', () => {
    const daily = dailySeries(facts, range)
    expect(daily).toHaveLength(range.days)
    expect(sumTotals(daily).spend).toBeCloseTo(total.spend, 2)
  })

  it('weekly series starts weeks on Monday and sums to the total', () => {
    const weekly = weeklySeries(facts, range)
    expect(weekly.slice(1).every((w) => new Date(`${w.date}T00:00`).getDay() === 1)).toBe(true)
    expect(sumTotals(weekly).clicks).toBe(total.clicks)
  })

  it('fills days without data with zeros', () => {
    const promoOnly = data.facts.filter((f) => f.campaignId === 'email-promo')
    const daily = dailySeries(promoOnly, range)
    expect(daily).toHaveLength(range.days)
    expect(daily.filter((d) => d.revenue > 0).length).toBeLessThan(5)
  })
})
