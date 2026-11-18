import { KpiCard } from '@/components/kpi-card'
import { series } from '@/lib/aggregate'
import { formatDateRange } from '@/lib/format'
import type { MetricKey } from '@/lib/metrics'
import { comparisonState, defaultGranularity, kpiSummary } from '@/lib/summaries'
import { useFilteredData } from '@/store/use-filtered-data'

const OVERVIEW_KPIS: readonly MetricKey[] = ['spend', 'revenue', 'roas', 'orders', 'cpa', 'newCustomers']

export function KpiRow() {
  const { facts, range, previous, totals, previousTotals, filters } = useFilteredData()
  const comparison = comparisonState(filters.compare, previous)
  const points = series(facts, range, defaultGranularity(range))

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {OVERVIEW_KPIS.map((key) => (
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
