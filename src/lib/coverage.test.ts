import { describe, expect, it } from 'vitest'
import { getDataset } from '@/data/generate'
import { coverage } from './coverage'

describe('coverage', () => {
  const data = getDataset()

  it('spans the whole history for all channels', () => {
    expect(coverage(data, ['search', 'tiktok'])).toEqual({ from: data.startDate, to: data.endDate })
  })

  it('starts TikTok at its launch, 120 days before asOfDate', () => {
    expect(coverage(data, ['tiktok'])).toEqual({ from: '2025-08-07', to: data.endDate })
  })
})
