import { ChannelStepComparison } from '@/components/funnel/channel-step-comparison'
import { DropOffCallout } from '@/components/funnel/drop-off-callout'
import { FunnelStages } from '@/components/funnel/funnel-stages'
import { KpiGrid } from '@/components/kpi-grid'
import { totalsByChannel } from '@/lib/aggregate'
import { biggestDropOff, funnelStages } from '@/lib/funnel'
import { comparisonState } from '@/lib/summaries'
import { useFilteredData } from '@/store/use-filtered-data'

const FUNNEL_KPIS = ['ctr', 'landingRate', 'cartRate', 'checkoutRate', 'cvr', 'orders'] as const

export function FunnelPage() {
  const { facts, previousFacts, totals, previousTotals, filters, previous, range } = useFilteredData()
  const showPrevious = comparisonState(filters.compare, previous) === 'on'
  const prior = showPrevious ? previousTotals : null
  const byChannel = totalsByChannel(facts)
  const dropOff = biggestDropOff(totals, prior, byChannel)

  return (
    <div className="flex flex-col gap-6">
      <KpiGrid metrics={FUNNEL_KPIS} facts={facts} previousFacts={previousFacts} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FunnelStages stages={funnelStages(totals, prior)} dropOff={dropOff} showPrevious={showPrevious} range={range} />
        </div>
        <DropOffCallout dropOff={dropOff} />
      </div>
      <ChannelStepComparison byChannel={byChannel} channels={filters.channels} totals={totals} />
    </div>
  )
}
