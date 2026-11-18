import { KpiCard } from '@/components/kpi-card'
import type { DailyFact } from '@/data/types'
import { series } from '@/lib/aggregate'
import { formatDateRange } from '@/lib/format'
import { sumTotals, type MetricKey } from '@/lib/metrics'
import { comparisonState, defaultGranularity, kpiSummary } from '@/lib/summaries'
import { cn } from '@/lib/utils'
import { useFilteredData } from '@/store/use-filtered-data'

interface KpiGridProps {
  metrics: readonly MetricKey[]
  facts: readonly DailyFact[]
  previousFacts: readonly DailyFact[]
  className?: string
}

/** KPI tiles for any slice of facts (all channels, one channel, one campaign) over the global range. */
export function KpiGrid({ metrics, facts, previousFacts, className }: KpiGridProps) {
  const { range, previous, filters } = useFilteredData()
  const comparison = comparisonState(filters.compare, previous)
  const totals = sumTotals(facts)
  const previousTotals = sumTotals(previousFacts)
  const points = series(facts, range, defaultGranularity(range))

  return (
    <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6', className)}>
      {metrics.map((key) => (
        <KpiCard
          key={key}
          summary={kpiSummary(key, totals, previousTotals, comparison, points)}
          comparison={comparison}
          previousLabel={formatDateRange(previous.from, previous.to)}
        />
      ))}
    </div>
  )
}
