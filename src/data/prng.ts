// The only source of randomness in the app. Same seed, same numbers, every load.

export type Rng = () => number

/** mulberry32: a tiny, fast, well-distributed 32-bit generator. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Derives an independent seed for a named stream (FNV-1a over the key), so each campaign
 * gets its own sequence and adding a campaign doesn't reshuffle the others.
 */
export function seedFrom(seed: number, key: string): number {
  let hash = 0x811c9dc5 ^ seed
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function uniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** Multiplicative noise: jitter(rng, 0.1) returns a factor in [0.9, 1.1). */
export function jitter(rng: Rng, amount: number): number {
  return 1 + (rng() * 2 - 1) * amount
}
