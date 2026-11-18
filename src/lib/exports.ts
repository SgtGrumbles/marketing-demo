import type { CampaignRow } from '@/lib/campaigns'
import type { CsvColumn } from '@/lib/csv'
import { channelLabel } from '@/lib/channels'
import type { CreativeRow } from '@/lib/creatives'
import type { DateRange } from '@/lib/date-range'
import type { Projection } from '@/lib/planner'
import type { ChannelRow } from '@/lib/summaries'

// CSV layouts for each exportable table. Raw values (no currency symbols or rounding) so they work in a spreadsheet.

export const CAMPAIGN_CSV: readonly CsvColumn<CampaignRow>[] = [
  { header: 'Campaign', value: (r) => r.name },
  { header: 'Channel', value: (r) => r.channel },
  { header: 'Status', value: (r) => r.status },
  { header: 'Spend', value: (r) => r.spend.toFixed(2) },
  { header: 'Revenue', value: (r) => r.revenue.toFixed(2) },
  { header: 'ROAS', value: (r) => r.roas?.toFixed(2) },
  { header: 'CPA', value: (r) => r.cpa?.toFixed(2) },
  { header: 'Monthly budget', value: (r) => r.pacing?.budget },
  { header: 'Month-to-date spend', value: (r) => r.pacing?.monthToDate.toFixed(2) },
  { header: 'Pacing', value: (r) => r.pacing?.pacing?.toFixed(3) },
]

export const CREATIVE_CSV: readonly CsvColumn<CreativeRow>[] = [
  { header: 'Creative', value: (r) => r.name },
  { header: 'Format', value: (r) => r.format },
  { header: 'Campaign', value: (r) => r.campaignName },
  { header: 'Impressions', value: (r) => r.impressions },
  { header: 'CTR', value: (r) => r.ctr?.toFixed(4) },
  { header: 'CTR change (21 days)', value: (r) => r.signal?.ctrChange?.toFixed(4) },
  { header: 'Frequency', value: (r) => r.frequency?.toFixed(2) },
  { header: 'CPA', value: (r) => r.cpa?.toFixed(2) },
  { header: 'Fatigued', value: (r) => (r.signal?.fatigued ? 'yes' : 'no') },
]

export const CHANNEL_CSV: readonly CsvColumn<ChannelRow>[] = [
  { header: 'Channel', value: (r) => r.label },
  { header: 'Spend', value: (r) => r.spend.toFixed(2) },
  { header: 'Revenue', value: (r) => r.revenue.toFixed(2) },
  { header: 'ROAS', value: (r) => r.roas?.toFixed(2) },
  { header: 'CPA', value: (r) => r.cpa?.toFixed(2) },
  { header: 'CVR', value: (r) => r.cvr?.toFixed(4) },
  { header: 'Share of spend', value: (r) => r.spendShare?.toFixed(4) },
]

/** The plan next to the last 30 days, one row per channel. */
export const PLAN_CSV: readonly CsvColumn<{ proposed: Projection; current: Projection }>[] = [
  { header: 'Channel', value: (r) => channelLabel(r.proposed.channel) },
  { header: 'Held fixed', value: (r) => (r.proposed.fixed ? 'yes' : 'no') },
  { header: 'Current budget', value: (r) => r.current.spend.toFixed(2) },
  { header: 'Proposed budget', value: (r) => r.proposed.spend.toFixed(2) },
  { header: 'Current revenue', value: (r) => r.current.revenue.toFixed(2) },
  { header: 'Projected revenue', value: (r) => r.proposed.revenue.toFixed(2) },
  { header: 'Current ROAS', value: (r) => r.current.roas?.toFixed(2) },
  { header: 'Projected ROAS', value: (r) => r.proposed.roas?.toFixed(2) },
  { header: 'Current orders', value: (r) => r.current.orders.toFixed(0) },
  { header: 'Projected orders', value: (r) => r.proposed.orders.toFixed(0) },
]

/** pulse-meta-campaigns-2025-11-05-2025-12-04.csv */
export function exportFilename(subject: string, range: Pick<DateRange, 'from' | 'to'>): string {
  return `pulse-${subject}-${range.from}-${range.to}.csv`
}
