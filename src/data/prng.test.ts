import { describe, expect, it } from 'vitest'
import { jitter, mulberry32, seedFrom } from './prng'

describe('prng', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const first = Array.from({ length: 5 }, a)
    expect(Array.from({ length: 5 }, b)).toEqual(first)
    expect(Array.from({ length: 5 }, mulberry32(43))).not.toEqual(first)
  })

  it('stays in [0, 1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 10_000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('derives distinct streams per key', () => {
    expect(seedFrom(1, 'search-brand')).toBe(seedFrom(1, 'search-brand'))
    expect(seedFrom(1, 'search-brand')).not.toBe(seedFrom(1, 'meta-lookalike'))
  })

  it('jitter stays within its amplitude', () => {
    const rng = mulberry32(1)
    for (let i = 0; i < 1000; i++) {
      const factor = jitter(rng, 0.1)
      expect(factor).toBeGreaterThanOrEqual(0.9)
      expect(factor).toBeLessThan(1.1)
    }
  })
})
