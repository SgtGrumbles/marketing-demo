import type { CampaignRow } from '@/lib/campaigns'
import type { CsvColumn } from '@/lib/csv'
import type { CreativeRow } from '@/lib/creatives'
import type { DateRange } from '@/lib/date-range'

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

/** pulse-meta-campaigns-2025-11-05-2025-12-04.csv */
export function exportFilename(subject: string, range: Pick<DateRange, 'from' | 'to'>): string {
  return `pulse-${subject}-${range.from}-${range.to}.csv`
}
