import { getDataset } from '@/data/generate'
import type { DailyFact, Dataset } from '@/data/types'
import { filterFacts } from '@/lib/aggregate'
import { dataBounds, previousRange, resolveRange, type DateRange, type PreviousRange } from '@/lib/date-range'
import type { Filters } from '@/lib/filter-params'
import { sumTotals, type Totals } from '@/lib/metrics'
import { useFilterStore } from './filters'

export interface FilteredData {
  data: Dataset
  filters: Filters
  range: DateRange
  previous: PreviousRange
  facts: readonly DailyFact[]
  previousFacts: readonly DailyFact[]
  totals: Totals
  previousTotals: Totals
}

/** Facts and totals for a set of filters, plus the matching previous period. */
export function selectFilteredData(filters: Filters, data: Dataset = getDataset()): FilteredData {
  const bounds = dataBounds(data)
  const custom = filters.from && filters.to ? { from: filters.from, to: filters.to } : undefined
  const range = resolveRange(filters.range, bounds, custom)
  const previous = previousRange(range, bounds)
  const facts = filterFacts(data.facts, range, filters.channels)
  const previousFacts = filterFacts(data.facts, previous, filters.channels)
  return { data, filters, range, previous, facts, previousFacts, totals: sumTotals(facts), previousTotals: sumTotals(previousFacts) }
}

/** Remembers the last result, like reselect, so every component reading the same filters shares one computation. */
function memoizeLast<A, R>(compute: (arg: A) => R): (arg: A) => R {
  let last: { arg: A; result: R } | undefined
  return (arg) => {
    if (!last || last.arg !== arg) last = { arg, result: compute(arg) }
    return last.result
  }
}

const selectCurrent = memoizeLast((filters: Filters) => selectFilteredData(filters))

export function useFilteredData(): FilteredData {
  return selectCurrent(useFilterStore((state) => state.filters))
}
