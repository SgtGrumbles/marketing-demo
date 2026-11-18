import { NoDataState } from '@/components/no-data-state'
import { KpiGrid } from '@/components/kpi-grid'
import { ChannelTable } from '@/components/overview/channel-table'
import { InsightsPreview } from '@/components/overview/insights-preview'
import { SpendMix } from '@/components/overview/spend-mix'
import { SpendRevenueChart } from '@/components/overview/spend-revenue-chart'
import { useFilteredData } from '@/store/use-filtered-data'

const OVERVIEW_KPIS = ['spend', 'revenue', 'roas', 'orders', 'cpa', 'newCustomers'] as const

export function OverviewPage() {
  const { facts, previousFacts, filters, range } = useFilteredData()
  if (facts.length === 0) return <NoDataState channels={filters.channels} range={range} />

  return (
    <div className="flex flex-col gap-6">
      <KpiGrid metrics={OVERVIEW_KPIS} facts={facts} previousFacts={previousFacts} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SpendRevenueChart />
        </div>
        <InsightsPreview />
      </div>
      <div className="grid gap-6 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          <ChannelTable />
        </div>
        <SpendMix />
      </div>
    </div>
  )
}
