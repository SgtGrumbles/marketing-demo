import { useState } from 'react'
import { MetricPicker } from '@/components/charts/metric-picker'
import { MetricTrendChart } from '@/components/charts/metric-trend-chart'
import { ChannelBadge } from '@/components/channel-badge'
import { KpiGrid } from '@/components/kpi-grid'
import { PacingBar } from '@/components/pacing-bar'
import { StatusBadge } from '@/components/status-badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Campaign } from '@/data/types'
import { filterFacts } from '@/lib/aggregate'
import { pacingByCampaign } from '@/lib/campaigns'
import { channelColor } from '@/lib/channels'
import { creativeRows } from '@/lib/creatives'
import { formatCurrency, formatDateRange, formatDateTooltip } from '@/lib/format'
import type { MetricKey } from '@/lib/metrics'
import { channelKpis } from '@/lib/summaries'
import { useCampaignParam } from '@/store/use-campaign-param'
import { useFilteredData } from '@/store/use-filtered-data'
import { CreativesTable } from './creatives-table'
import { useSortedCreatives } from './use-sorted-creatives'

/** Campaign detail, opened from any table via ?campaign=id. Mounted once in the app layout. */
export function CampaignDrawer() {
  const { data } = useFilteredData()
  const { campaignId, closeCampaign } = useCampaignParam()
  const campaign = data.campaigns.find((c) => c.id === campaignId)

  return (
    <Sheet open={campaign !== undefined} onOpenChange={(open) => !open && closeCampaign()}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-3xl" data-testid="campaign-drawer">
        {campaign && <CampaignDetail key={campaign.id} campaign={campaign} />}
      </SheetContent>
    </Sheet>
  )
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const { data, range, previous } = useFilteredData()
  const own = data.facts.filter((f) => f.campaignId === campaign.id)
  const facts = filterFacts(own, range, [campaign.channel])
  const previousFacts = filterFacts(own, previous, [campaign.channel])
  const hasSpend = own.some((f) => f.spend > 0)
  const [metric, setMetric] = useState<MetricKey>(hasSpend ? 'spend' : 'revenue')
  const pacing = pacingByCampaign(data).get(campaign.id)
  const creatives = useSortedCreatives(creativeRows(data, new Set([campaign.id]), range))

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <SheetTitle className="font-mono text-base">{campaign.name}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={campaign.channel} />
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-muted-foreground">
              {campaign.endDate ? formatDateRange(campaign.startDate, campaign.endDate) : `Since ${formatDateTooltip(campaign.startDate)}`}
            </span>
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-6 p-4">
        <section className="grid gap-2">
          <h3 className="text-sm font-medium">{formatDateRange(range.from, range.to)}</h3>
          <KpiGrid metrics={channelKpis(campaign.channel)} facts={facts} previousFacts={previousFacts} className="md:grid-cols-3 xl:grid-cols-3" />
        </section>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Trend</h3>
            <MetricPicker value={metric} onChange={setMetric} hasSpend={hasSpend} />
          </div>
          <MetricTrendChart metric={metric} facts={facts} previousFacts={previousFacts} color={channelColor(campaign.channel)} />
        </section>

        {pacing && (
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">Budget this month</h3>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border p-4">
              <PacingBar pacing={pacing} className="w-48" />
              <Figure label="Spent so far" value={formatCurrency(pacing.monthToDate)} />
              <Figure label="Monthly budget" value={formatCurrency(pacing.budget)} />
              <Figure label="Projected month-end" value={formatCurrency(pacing.projected)} />
            </div>
          </section>
        )}

        {creatives.sorted.length > 0 && (
          <section className="grid gap-2">
            <h3 className="text-sm font-medium">Creatives</h3>
            <CreativesTable rows={creatives.sorted} sort={creatives.sort} onSort={creatives.onSort} showCampaign={false} />
          </section>
        )}
      </div>
    </>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
