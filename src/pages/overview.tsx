import { ChannelTable } from '@/components/overview/channel-table'
import { InsightsPreview } from '@/components/overview/insights-preview'
import { KpiRow } from '@/components/overview/kpi-row'
import { SpendMix } from '@/components/overview/spend-mix'
import { SpendRevenueChart } from '@/components/overview/spend-revenue-chart'

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <KpiRow />
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
