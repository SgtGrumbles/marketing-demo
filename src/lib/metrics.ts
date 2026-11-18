import type { ValueFormat } from '@/lib/format'

// Every metric formula lives here. Ratios are always computed from summed components,
// never by averaging daily ratios. A zero denominator yields null, which displays as "—".

export const SUMMED_FIELDS = [
  'impressions',
  'clicks',
  'spend',
  'sessions',
  'addToCarts',
  'orders',
  'revenue',
  'newCustomers',
] as const

export type SummedField = (typeof SUMMED_FIELDS)[number]
export type Totals = Record<SummedField, number>

export function emptyTotals(): Totals {
  return { impressions: 0, clicks: 0, spend: 0, sessions: 0, addToCarts: 0, orders: 0, revenue: 0, newCustomers: 0 }
}

/** Sums the funnel fields of any rows that carry them (DailyFact, or pre-aggregated totals). */
export function sumTotals(rows: Iterable<Totals>): Totals {
  const totals = emptyTotals()
  for (const row of rows) {
    for (const field of SUMMED_FIELDS) totals[field] += row[field]
  }
  return totals
}

export function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator
}

export const ctr = (t: Pick<Totals, 'clicks' | 'impressions'>) => ratio(t.clicks, t.impressions)
export const cpc = (t: Pick<Totals, 'spend' | 'clicks'>) => ratio(t.spend, t.clicks)
export const cpm = (t: Pick<Totals, 'spend' | 'impressions'>) => ratio(t.spend * 1000, t.impressions)
export const cvr = (t: Pick<Totals, 'orders' | 'sessions'>) => ratio(t.orders, t.sessions)
export const cpa = (t: Pick<Totals, 'spend' | 'orders'>) => ratio(t.spend, t.orders)
export const roas = (t: Pick<Totals, 'revenue' | 'spend'>) => ratio(t.revenue, t.spend)
export const aov = (t: Pick<Totals, 'revenue' | 'orders'>) => ratio(t.revenue, t.orders)
export const cac = (t: Pick<Totals, 'spend' | 'newCustomers'>) => ratio(t.spend, t.newCustomers)
/** Marketing efficiency ratio: pass totals across all channels, including unpaid ones. */
export const mer = (allChannels: Pick<Totals, 'revenue' | 'spend'>) => ratio(allChannels.revenue, allChannels.spend)

export type GoodDirection = 'up' | 'down' | 'neutral'

export type MetricKey =
  | SummedField
  | 'ctr'
  | 'cpc'
  | 'cpm'
  | 'cvr'
  | 'cpa'
  | 'roas'
  | 'aov'
  | 'cac'
  | 'mer'

export interface MetricDefinition {
  key: MetricKey
  label: string
  format: ValueFormat
  goodDirection: GoodDirection
  compute: (totals: Totals) => number | null
}

const summed = (key: SummedField, label: string, format: ValueFormat, goodDirection: GoodDirection): MetricDefinition => ({
  key,
  label,
  format,
  goodDirection,
  compute: (t) => t[key],
})

export const METRICS: Readonly<Record<MetricKey, MetricDefinition>> = {
  spend: summed('spend', 'Spend', 'currency', 'neutral'),
  revenue: summed('revenue', 'Revenue', 'currency', 'up'),
  orders: summed('orders', 'Orders', 'count', 'up'),
  newCustomers: summed('newCustomers', 'New Customers', 'count', 'up'),
  impressions: summed('impressions', 'Impressions', 'count', 'up'),
  clicks: summed('clicks', 'Clicks', 'count', 'up'),
  sessions: summed('sessions', 'Sessions', 'count', 'up'),
  addToCarts: summed('addToCarts', 'Add to Cart', 'count', 'up'),
  ctr: { key: 'ctr', label: 'CTR', format: 'percent', goodDirection: 'up', compute: ctr },
  cpc: { key: 'cpc', label: 'CPC', format: 'unitCost', goodDirection: 'down', compute: cpc },
  cpm: { key: 'cpm', label: 'CPM', format: 'unitCost', goodDirection: 'down', compute: cpm },
  cvr: { key: 'cvr', label: 'CVR', format: 'percent', goodDirection: 'up', compute: cvr },
  cpa: { key: 'cpa', label: 'CPA', format: 'unitCost', goodDirection: 'down', compute: cpa },
  roas: { key: 'roas', label: 'ROAS', format: 'multiplier', goodDirection: 'up', compute: roas },
  aov: { key: 'aov', label: 'AOV', format: 'unitCost', goodDirection: 'up', compute: aov },
  cac: { key: 'cac', label: 'CAC', format: 'unitCost', goodDirection: 'down', compute: cac },
  mer: { key: 'mer', label: 'MER', format: 'multiplier', goodDirection: 'up', compute: mer },
}

/** Relative change, e.g. 0.124 for +12.4%. Null when either side is missing or the base is zero. */
export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

export type DeltaTone = 'good' | 'bad' | 'neutral'

/** Colors a delta by the metric's good direction: a falling CPA is good, spend is always neutral. */
export function deltaTone(goodDirection: GoodDirection, change: number | null): DeltaTone {
  if (change === null || change === 0 || goodDirection === 'neutral') return 'neutral'
  return (change > 0) === (goodDirection === 'up') ? 'good' : 'bad'
}

/**
 * Month-to-date spend against a straight-line share of the monthly budget.
 * 1.15 means spending 15% faster than the budget allows.
 */
export function budgetPacing(monthToDateSpend: number, monthlyBudget: number, elapsedDays: number, daysInMonth: number): number | null {
  return ratio(monthToDateSpend, monthlyBudget * (elapsedDays / daysInMonth))
}
