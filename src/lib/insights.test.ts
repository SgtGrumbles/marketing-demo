import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { CHANNEL_KEYS } from '@/data/types'
import { resolveRange } from './date-range'
import { DEFAULT_FILTERS } from './filter-params'
import { detectInsights, insightHref } from './insights'

const data = getDataset()
const bounds = { start: data.startDate, end: data.endDate }
const last30 = detectInsights({ data, range: resolveRange('30d', bounds), channels: CHANNEL_KEYS })
const find = (type: string, channel?: string) => last30.find((i) => i.type === type && (!channel || i.channel === channel))

describe('insights: the six planted storylines (last 30 days)', () => {
  it('1. Meta creative fatigue', () => {
    const insight = find('fatigue', 'meta')
    expect(insight?.title).toBe('Creative fatigue: Summer Trail – Video 03')
    expect(insight?.body).toMatch(/frequency rose from 1\.9 to 4\.5 .* CTR fell 39\.9% and CPA rose 34\.4%/)
  })

  it('2. TikTok is the paid-social efficiency leader', () => {
    expect(find('efficiency')?.body).toMatch(/^TikTok returned 3\.7x ROAS .* against 3\.1x for Meta, on just 22\.4% of paid social spend/)
  })

  it('3. Paid Search tracking outage nine days ago', () => {
    const insight = find('tracking', 'search')
    expect(insight?.date).toBe('2025-11-26')
    expect(insight?.body).toMatch(/orders fell to 58, 11\.8% of usual/)
  })

  it('4. Email promo spike four days ago', () => {
    const insight = find('anomaly', 'email')
    expect(insight?.date).toBe('2025-12-01')
    expect(insight?.body).toMatch(/\$9,457 on Dec 1, 2025 \(Cyber Monday\), 3\.5x its 28-day daily average/)
  })

  it('5. Holiday ramp', () => {
    expect(last30.filter((i) => i.type === 'trend').map((i) => i.title)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Spend up/), expect.stringMatching(/^Revenue up/)]),
    )
    expect(find('trend')?.body).toMatch(/Black Friday–Cyber Monday peak/)
  })

  it('6. Over-budget search campaign', () => {
    expect(find('pacing')?.body).toMatch(/115\.0% of plan .* \$99,400 budget/)
  })

  it('reports nothing else: no spillover anomalies from the outage', () => {
    expect(last30).toHaveLength(7)
    expect(last30.filter((i) => i.type === 'anomaly').map((i) => i.channel)).toEqual(['email'])
  })

  it('ranks warnings first', () => {
    expect(last30.slice(0, 3).every((i) => i.severity === 'warning')).toBe(true)
  })
})

describe('insights: filters', () => {
  it('only covers the selected channels', () => {
    const metaOnly = detectInsights({ data, range: resolveRange('30d', bounds), channels: ['meta'] })
    expect(metaOnly.some((i) => i.type === 'fatigue')).toBe(true)
    expect(metaOnly.some((i) => i.type === 'tracking' || i.type === 'pacing' || i.type === 'efficiency')).toBe(false)
  })

  it('builds View links on top of the current filters', () => {
    const tracking = find('tracking', 'search')
    expect(tracking && insightHref(tracking.link, DEFAULT_FILTERS)).toBe('/channels/search?range=custom&from=2025-11-12&to=2025-12-03')
    const pacing = find('pacing')
    expect(pacing && insightHref(pacing.link, { ...DEFAULT_FILTERS, range: '7d' })).toBe('/campaigns?range=7d&campaign=search-shopping')
  })
})
