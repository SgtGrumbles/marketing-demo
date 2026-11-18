import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { creativeRows } from './creatives'
import { resolveRange } from './date-range'

const data = getDataset()
const bounds = { start: data.startDate, end: data.endDate }
const allCampaigns = new Set(data.campaigns.map((c) => c.id))

describe('creative fatigue rule', () => {
  it('fires for the planted creative, and only that one, at the end of the data', () => {
    const rows = creativeRows(data, allCampaigns, resolveRange('30d', bounds))
    const fatigued = rows.filter((r) => r.signal?.fatigued)
    expect(fatigued.map((r) => r.name)).toEqual(['Summer Trail – Video 03'])
    const [video] = fatigued
    expect(video?.signal?.frequencyTo).toBeGreaterThan(4)
    expect(video?.signal?.ctrChange).toBeLessThan(-0.3)
    expect(video?.signal?.cpaChange).toBeGreaterThan(0.2)
  })

  it('stays quiet before the fatigue window', () => {
    const rows = creativeRows(data, allCampaigns, resolveRange('custom', bounds, { from: '2025-09-01', to: '2025-09-30' }))
    expect(rows.some((r) => r.signal?.fatigued)).toBe(false)
  })

  it('totals creatives over the range and drops ones with no delivery', () => {
    const rows = creativeRows(data, new Set(['meta-broad']), resolveRange('30d', bounds))
    expect(rows).toEqual([])
  })
})
