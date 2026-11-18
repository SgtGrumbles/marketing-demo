import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { CHANNEL_KEYS } from '@/data/types'
import { filterFacts } from './aggregate'
import { campaignRows, pacingByCampaign, pacingTone } from './campaigns'
import { resolveRange } from './date-range'
import { sumTotals } from './metrics'

const data = getDataset()

describe('campaign rows', () => {
  const range = resolveRange('30d', { start: data.startDate, end: data.endDate })
  const facts = filterFacts(data.facts, range, CHANNEL_KEYS)
  const rows = campaignRows(data, facts, CHANNEL_KEYS)

  it('has every campaign and reconciles with the filtered total', () => {
    expect(rows).toHaveLength(data.campaigns.length)
    expect(sumTotals(rows.map((r) => r.totals)).spend).toBeCloseTo(sumTotals(facts).spend, 2)
  })

  it('flags the over-budget campaign, and only it', () => {
    const pacing = pacingByCampaign(data)
    expect(pacing.get('search-shopping')?.pacing).toBeCloseTo(1.15, 2)
    const over = [...pacing.entries()].filter(([, p]) => pacingTone(p.pacing) === 'over').map(([id]) => id)
    expect(over).toEqual(['search-shopping'])
  })

  it('carries a 30-day spend trend', () => {
    expect(rows.find((r) => r.id === 'meta-lookalike')?.trend).toHaveLength(30)
  })
})
