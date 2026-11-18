import { describe, expect, it } from 'vitest'
import { niceTicks } from './ticks'

describe('niceTicks', () => {
  it('steps by round numbers without passing the maximum', () => {
    expect(niceTicks(790_000)).toEqual([0, 250_000, 500_000, 750_000])
    expect(niceTicks(630_000)).toEqual([0, 200_000, 400_000, 600_000])
    expect(niceTicks(230_000)).toEqual([0, 50_000, 100_000, 150_000, 200_000])
    expect(niceTicks(0)).toEqual([0])
  })
})
