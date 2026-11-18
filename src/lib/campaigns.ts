import { getDaysInMonth, parseISO, subDays } from 'date-fns'
import { toISODate } from '@/data/calendar'
import type { Campaign, ChannelKey, DailyFact, Dataset } from '@/data/types'
import { dailySeries, totalsByCampaign } from '@/lib/aggregate'
import { budgetPacing, METRICS, ratio, sumTotals, type Totals } from '@/lib/metrics'

export interface Pacing {
  budget: number
  monthToDate: number
  /** Share of the month elapsed (data days so far / days in month). */
  expectedShare: number
  /** Share of the budget already spent. */
  usedShare: number
  /** 1.15 = spending 15% faster than plan. */
  pacing: number | null
  /** Month-end spend at the current daily rate. */
  projected: number
}

export type PacingTone = 'over' | 'under' | 'on-track'

/** Over 110% of plan is a problem; under 90% is underdelivering. */
export function pacingTone(pacing: number | null): PacingTone {
  if (pacing === null) return 'on-track'
  return pacing > 1.1 ? 'over' : pacing < 0.9 ? 'under' : 'on-track'
}

const memo = <T,>(build: (data: Dataset) => T) => {
  const cache = new WeakMap<Dataset, T>()
  return (data: Dataset): T => {
    let value = cache.get(data)
    if (value === undefined) {
      value = build(data)
      cache.set(data, value)
    }
    return value
  }
}

/** Month-to-date budget pacing for every campaign with a budget, as of the last day of data. */
export const pacingByCampaign = memo((data: Dataset): Map<string, Pacing> => {
  const lastDay = parseISO(data.endDate)
  const elapsed = lastDay.getDate()
  const daysInMonth = getDaysInMonth(lastDay)
  const monthStart = `${data.endDate.slice(0, 8)}01`
  const monthToDate = totalsByCampaign(data.facts.filter((f) => f.date >= monthStart))

  const result = new Map<string, Pacing>()
  for (const campaign of data.campaigns) {
    if (campaign.monthlyBudget === undefined) continue
    const spent = monthToDate.get(campaign.id)?.spend ?? 0
    result.set(campaign.id, {
      budget: campaign.monthlyBudget,
      monthToDate: spent,
      expectedShare: elapsed / daysInMonth,
      usedShare: ratio(spent, campaign.monthlyBudget) ?? 0,
      pacing: budgetPacing(spent, campaign.monthlyBudget, elapsed, daysInMonth),
      projected: (spent / elapsed) * daysInMonth,
    })
  }
  return result
})

/** Daily spend for the last 30 days of data, per campaign (fixed window, independent of filters). */
export const recentSpendByCampaign = memo((data: Dataset): Map<string, { date: string; value: number }[]> => {
  const range = { from: toISODate(subDays(parseISO(data.endDate), 29)), to: data.endDate }
  const recent = new Map<string, DailyFact[]>()
  for (const fact of data.facts) {
    if (fact.date < range.from) continue
    const list = recent.get(fact.campaignId) ?? []
    list.push(fact)
    recent.set(fact.campaignId, list)
  }
  return new Map(data.campaigns.map((c) => [c.id, dailySeries(recent.get(c.id) ?? [], range).map((p) => ({ date: p.date, value: p.spend }))]))
})

export interface CampaignRow {
  campaign: Campaign
  id: string
  name: string
  channel: ChannelKey
  status: Campaign['status']
  totals: Totals
  spend: number
  revenue: number
  roas: number | null
  cpa: number | null
  ctr: number | null
  cvr: number | null
  pacing: Pacing | null
  trend: { date: string; value: number }[]
}

/** One row per campaign in the selected channels, with totals for the filtered facts (zeros if inactive). */
export function campaignRows(data: Dataset, facts: readonly DailyFact[], channels: readonly ChannelKey[]): CampaignRow[] {
  const byCampaign = totalsByCampaign(facts)
  const pacing = pacingByCampaign(data)
  const trends = recentSpendByCampaign(data)
  return data.campaigns
    .filter((campaign) => channels.includes(campaign.channel))
    .map((campaign) => {
      const totals = byCampaign.get(campaign.id) ?? sumTotals([])
      return {
        campaign,
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        totals,
        spend: totals.spend,
        revenue: totals.revenue,
        roas: METRICS.roas.compute(totals),
        cpa: METRICS.cpa.compute(totals),
        ctr: METRICS.ctr.compute(totals),
        cvr: METRICS.cvr.compute(totals),
        pacing: pacing.get(campaign.id) ?? null,
        trend: trends.get(campaign.id) ?? [],
      }
    })
}
