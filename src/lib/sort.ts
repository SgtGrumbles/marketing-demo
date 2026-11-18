export type SortDirection = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

type Sortable = number | string | null | undefined

/** Sorts a copy of `rows`. Missing values always sink to the bottom, whatever the direction. */
export function sortRows<T, K extends string>(rows: readonly T[], sort: SortState<K>, valueOf: (row: T, key: K) => Sortable): T[] {
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = valueOf(a, sort.key)
    const y = valueOf(b, sort.key)
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1
    if (typeof x === 'string' || typeof y === 'string') return sign * String(x).localeCompare(String(y))
    return sign * (x - y)
  })
}

/** Clicking the active column flips it; a new column starts descending (biggest first), text ascending. */
export function nextSort<K extends string>(current: SortState<K> | null, key: K, textKey = false): SortState<K> {
  if (current?.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  return { key, direction: textKey ? 'asc' : 'desc' }
}
