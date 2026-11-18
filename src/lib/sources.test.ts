import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { CHANNEL_KEYS } from '@/data/types'
import { SOURCES, sourceAccounts, sourceVolumes } from './sources'

describe('sources', () => {
  const data = getDataset()
  const volumes = sourceVolumes(data)

  it('has five connected sources and two not', () => {
    expect(SOURCES.filter((s) => s.connected)).toHaveLength(5)
    expect(SOURCES.filter((s) => !s.connected).map((s) => s.key)).toEqual(['klaviyo', 'affiliate'])
  })

  it('covers every channel, with row counts that reconcile with the dataset', () => {
    const channelSources = SOURCES.filter((s) => s.channels !== 'all')
    expect(channelSources.flatMap((s) => s.channels).sort()).toEqual(CHANNEL_KEYS.filter((c) => c !== 'organic').sort())
    const organicRows = data.facts.filter((f) => f.channel === 'organic').length
    const channelRows = channelSources.reduce((sum, s) => sum + (volumes.get(s.key)?.rows ?? 0), 0)
    expect(channelRows + organicRows).toBe(data.facts.length)
    expect(volumes.get('shopify')).toEqual({ rows: data.facts.length, days: 540 })
  })

  it('offers stable fictional accounts', () => {
    const source = SOURCES[0]
    expect(source && sourceAccounts(source)).toEqual(source && sourceAccounts(source))
    expect(source && sourceAccounts(source)[0]?.detail).toMatch(/^Main account · \d{3}-\d{3}-\d{4}$/)
  })
})
