import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { CampaignTable } from '@/components/campaigns/campaign-table'
import { NoDataState } from '@/components/no-data-state'
import { CreativesTable } from '@/components/campaigns/creatives-table'
import { useSortedCampaigns } from '@/components/campaigns/use-sorted-campaigns'
import { useSortedCreatives } from '@/components/campaigns/use-sorted-creatives'
import { ChannelTabs } from '@/components/channels/channel-tabs'
import { MetricPicker } from '@/components/charts/metric-picker'
import { MetricTrendChart } from '@/components/charts/metric-trend-chart'
import { ExportButton } from '@/components/export-button'
import { KpiGrid } from '@/components/kpi-grid'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CHANNEL_KEYS, type ChannelKey } from '@/data/types'
import { filterFacts } from '@/lib/aggregate'
import { campaignRows } from '@/lib/campaigns'
import { channelColor, channelLabel, CHANNELS } from '@/lib/channels'
import { creativeRows, describeFatigueRule } from '@/lib/creatives'
import { toCsv } from '@/lib/csv'
import { CAMPAIGN_CSV, CREATIVE_CSV, exportFilename } from '@/lib/exports'
import { filterSearch } from '@/lib/filter-params'
import { formatDateRange } from '@/lib/format'
import type { MetricKey } from '@/lib/metrics'
import { channelKpis } from '@/lib/summaries'
import { useCampaignParam } from '@/store/use-campaign-param'
import { useFilteredData } from '@/store/use-filtered-data'

const isChannelKey = (value: string | undefined): value is ChannelKey => CHANNEL_KEYS.some((key) => key === value)

export function ChannelsPage() {
  const { channel } = useParams()
  const { filters } = useFilteredData()

  if (!isChannelKey(channel)) {
    const [first = 'search'] = filters.channels
    return <Navigate replace to={{ pathname: `/channels/${first}`, search: filterSearch(filters) }} />
  }
  // Keyed so the metric picker and table sorts reset when switching channels.
  return <ChannelView key={channel} channel={channel} />
}

function ChannelView({ channel }: { channel: ChannelKey }) {
  const { data, range, previous } = useFilteredData()
  const { openCampaign } = useCampaignParam()
  const facts = filterFacts(data.facts, range, [channel])
  const previousFacts = filterFacts(data.facts, previous, [channel])
  const hasSpend = CHANNELS[channel].paid || facts.some((f) => f.spend > 0)
  const [metric, setMetric] = useState<MetricKey>('revenue')

  const campaigns = useSortedCampaigns(campaignRows(data, facts, [channel]))
  const creatives = useSortedCreatives(creativeRows(data, new Set(campaigns.sorted.map((c) => c.id)), range))
  const label = channelLabel(channel)

  if (facts.length === 0)
    return (
      <ChannelTabs value={channel}>
        <NoDataState channels={[channel]} range={range} canWidenChannels={false} />
      </ChannelTabs>
    )

  return (
    <ChannelTabs value={channel}>
      <KpiGrid metrics={channelKpis(channel)} facts={facts} previousFacts={previousFacts} />

      <Card>
        <CardHeader>
          <CardTitle>{label} trend</CardTitle>
          <CardDescription>{formatDateRange(range.from, range.to)}</CardDescription>
          <CardAction>
            <MetricPicker value={metric} onChange={setMetric} hasSpend={hasSpend} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <MetricTrendChart metric={metric} facts={facts} previousFacts={previousFacts} color={channelColor(channel)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Select a campaign for details</CardDescription>
          <CardAction>
            <ExportButton filename={exportFilename(`${channel}-campaigns`, range)} build={() => toCsv(campaigns.sorted, CAMPAIGN_CSV)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <CampaignTable rows={campaigns.sorted} sort={campaigns.sort} onSort={campaigns.onSort} onOpen={openCampaign} showChannel={false} />
        </CardContent>
      </Card>

      {creatives.sorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Creatives</CardTitle>
            <CardDescription>Fatigue: {describeFatigueRule()}</CardDescription>
            <CardAction>
              <ExportButton filename={exportFilename(`${channel}-creatives`, range)} build={() => toCsv(creatives.sorted, CREATIVE_CSV)} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <CreativesTable rows={creatives.sorted} sort={creatives.sort} onSort={creatives.onSort} />
          </CardContent>
        </Card>
      )}
    </ChannelTabs>
  )
}
