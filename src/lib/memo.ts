import type { Dataset } from '@/data/types'

/** Caches a derived value per dataset (computed once, garbage-collected with it). */
export function memoByDataset<T>(build: (data: Dataset) => T): (data: Dataset) => T {
  const cache = new WeakMap<Dataset, T>()
  return (data) => {
    let value = cache.get(data)
    if (value === undefined) {
      value = build(data)
      cache.set(data, value)
    }
    return value
  }
}

/** Remembers the last result, like reselect, so every component reading the same input shares one computation. */
export function memoizeLast<A, R>(compute: (arg: A) => R): (arg: A) => R {
  let last: { arg: A; result: R } | undefined
  return (arg) => {
    if (!last || last.arg !== arg) last = { arg, result: compute(arg) }
    return last.result
  }
}
