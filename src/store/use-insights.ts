import { detectInsights, type Insight } from '@/lib/insights'
import { memoizeLast } from '@/lib/memo'
import { useFilteredData, type FilteredData } from './use-filtered-data'

const selectInsights = memoizeLast(({ data, range, filters }: FilteredData) => detectInsights({ data, range, channels: filters.channels }))

/** Insights for the current filters, ranked. Shared by the Insights page and the Overview preview. */
export function useInsights(): Insight[] {
  return selectInsights(useFilteredData())
}
