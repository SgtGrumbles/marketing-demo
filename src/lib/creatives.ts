import { parseISO, subDays } from 'date-fns'
import { toISODate } from '@/data/calendar'
import type { Creative, CreativeDaily, CreativeFormat, Dataset } from '@/data/types'
import type { DateRange } from '@/lib/date-range'
import { cpa, ctr, percentChange } from '@/lib/metrics'

/**
 * Creative fatigue: over the trailing window, frequency rises while CTR falls. Compares the first
 * and last few days of the window. Shared by the creatives table and the insights engine.
 */
export const FATIGUE_RULE = { windowDays: 21, segmentDays: 3, minFrequencyRise: 0.3, minCtrDrop: 0.2 } as const

export interface FatigueSignal {
  from: string
  to: string
  frequencyFrom: number
  frequencyTo: number
  ctrChange: number | null
  cpaChange: number | null
  fatigued: boolean
}

type DeliveryTotals = { impressions: number; clicks: number; spend: number; orders: number; revenue: number }

function sumDelivery(rows: readonly CreativeDaily[]): DeliveryTotals {
  const totals = { impressions: 0, clicks: 0, spend: 0, orders: 0, revenue: 0 }
  for (const row of rows) {
    totals.impressions += row.impressions
    totals.clicks += row.clicks
    totals.spend += row.spend
    totals.orders += row.orders
    totals.revenue += row.revenue
  }
  return totals
}

const meanFrequency = (rows: readonly CreativeDaily[]) => rows.reduce((sum, r) => sum + r.frequency, 0) / Math.max(rows.length, 1)

/** Fatigue signal for one creative's rows over the window ending `endDate`; null without enough history. */
export function fatigueSignal(rows: readonly CreativeDaily[], endDate: string): FatigueSignal | null {
  const { windowDays, segmentDays, minFrequencyRise, minCtrDrop } = FATIGUE_RULE
  const from = toISODate(subDays(parseISO(endDate), windowDays - 1))
  const window = rows.filter((r) => r.date >= from && r.date <= endDate)
  if (window.length < windowDays) return null

  const first = window.slice(0, segmentDays)
  const last = window.slice(-segmentDays)
  const frequencyFrom = meanFrequency(first)
  const frequencyTo = meanFrequency(last)
  const ctrChange = percentChange(ctr(sumDelivery(last)), ctr(sumDelivery(first)))
  const cpaChange = percentChange(cpa(sumDelivery(last)), cpa(sumDelivery(first)))
  const frequencyRise = percentChange(frequencyTo, frequencyFrom) ?? 0
  return {
    from,
    to: endDate,
    frequencyFrom,
    frequencyTo,
    ctrChange,
    cpaChange,
    fatigued: frequencyRise >= minFrequencyRise && ctrChange !== null && ctrChange <= -minCtrDrop,
  }
}

export interface CreativeRow {
  creative: Creative
  id: string
  name: string
  format: CreativeFormat
  campaignId: string
  campaignName: string
  impressions: number
  spend: number
  revenue: number
  ctr: number | null
  cpa: number | null
  /** Average daily frequency over the last few days of the range (FATIGUE_RULE.segmentDays). */
  frequency: number | null
  signal: FatigueSignal | null
}

/** Creatives of the given campaigns, totalled over the range, with the fatigue rule evaluated at its end. */
export function creativeRows(data: Dataset, campaignIds: ReadonlySet<string>, range: Pick<DateRange, 'from' | 'to'>): CreativeRow[] {
  const campaignName = new Map(data.campaigns.map((c) => [c.id, c.name]))
  const rowsByCreative = new Map<string, CreativeDaily[]>()
  for (const row of data.creativeFacts) {
    const list = rowsByCreative.get(row.creativeId) ?? []
    list.push(row)
    rowsByCreative.set(row.creativeId, list)
  }

  return data.creatives
    .filter((creative) => campaignIds.has(creative.campaignId))
    .map((creative) => {
      const all = rowsByCreative.get(creative.id) ?? []
      const inRange = all.filter((r) => r.date >= range.from && r.date <= range.to)
      const totals = sumDelivery(inRange)
      const lastDays = inRange.slice(-FATIGUE_RULE.segmentDays)
      return {
        creative,
        id: creative.id,
        name: creative.name,
        format: creative.format,
        campaignId: creative.campaignId,
        campaignName: campaignName.get(creative.campaignId) ?? creative.campaignId,
        impressions: totals.impressions,
        spend: totals.spend,
        revenue: totals.revenue,
        ctr: ctr(totals),
        cpa: cpa(totals),
        frequency: lastDays.length ? meanFrequency(lastDays) : null,
        signal: fatigueSignal(all, range.to),
      }
    })
    .filter((row) => row.impressions > 0)
}

/** "frequency up 30%+ while CTR falls 20%+ over the last 21 days" */
export function describeFatigueRule(): string {
  const { minFrequencyRise, minCtrDrop, windowDays } = FATIGUE_RULE
  return `frequency up ${Math.round(minFrequencyRise * 100)}%+ while CTR falls ${Math.round(minCtrDrop * 100)}%+ over the last ${windowDays} days`
}
