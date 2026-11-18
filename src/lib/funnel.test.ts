import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { CHANNEL_KEYS } from '@/data/types'
import { filterFacts, totalsByChannel } from './aggregate'
import { resolveRange } from './date-range'
import { biggestDropOff, funnelStages } from './funnel'
import { emptyTotals, sumTotals } from './metrics'

const funnel = { ...emptyTotals(), impressions: 100_000, clicks: 2_000, sessions: 1_800, addToCarts: 120, orders: 40 }

describe('funnel', () => {
  it('computes step rates and people lost per stage', () => {
    const stages = funnelStages(funnel, null)
    expect(stages.map((s) => s.count)).toEqual([100_000, 2_000, 1_800, 120, 40])
    expect(stages[0]?.stepRate).toBeNull()
    expect(stages[2]?.stepRate).toBeCloseTo(0.9)
    expect(stages[3]?.lost).toBe(1_680)
  })

  it('names the weakest on-site step, ignoring CTR', () => {
    const drop = biggestDropOff(funnel, null, new Map())
    expect(drop?.label).toBe('Sessions → Add to cart')
    expect(drop?.to).toBe('addToCarts')
    expect(drop?.rate).toBeCloseTo(120 / 1_800)
  })

  it('calls out the channel trailing the blend at that step', () => {
    const strong = { ...emptyTotals(), clicks: 1_000, sessions: 900, addToCarts: 90, orders: 30 }
    const weak = { ...emptyTotals(), clicks: 1_000, sessions: 900, addToCarts: 30, orders: 10 }
    const total = sumTotals([strong, weak])
    const drop = biggestDropOff(total, null, new Map([['search', strong], ['tiktok', weak]]))
    expect(drop?.weakest).toEqual({ channel: 'tiktok', rate: 30 / 900 })
  })

  it('stages reconcile with the dataset totals', () => {
    const data = getDataset()
    const facts = filterFacts(data.facts, resolveRange('30d', { start: data.startDate, end: data.endDate }), CHANNEL_KEYS)
    const total = sumTotals(facts)
    expect(funnelStages(total, null).at(-1)?.count).toBe(total.orders)
    expect(biggestDropOff(total, null, totalsByChannel(facts))).not.toBeNull()
  })
})
