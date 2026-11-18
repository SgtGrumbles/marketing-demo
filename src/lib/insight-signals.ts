import { eachDayOfInterval, parseISO } from 'date-fns'
import { toISODate } from '@/data/calendar'
import { CHANNEL_KEYS, type ChannelKey, type Dataset } from '@/data/types'
import { groupTotals } from '@/lib/aggregate'
import { memoByDataset } from '@/lib/memo'
import { emptyTotals, type Totals } from '@/lib/metrics'

// Day-level signals behind the anomaly and tracking-gap rules, computed once per dataset over its
// whole history. Rules then just read the days that fall inside the selected range.

export interface DailyIndex {
  dates: readonly string[]
  position: ReadonlyMap<string, number>
  /** Per channel, one Totals per date (zeros where nothing ran). */
  byChannel: ReadonlyMap<ChannelKey, readonly Totals[]>
}

export const dailyIndex = memoByDataset((data: Dataset): DailyIndex => {
  const dates = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) }).map(toISODate)
  const grouped = groupTotals(data.facts, (f) => `${f.channel}|${f.date}`)
  const byChannel = new Map(CHANNEL_KEYS.map((channel) => [channel, dates.map((date) => grouped.get(`${channel}|${date}`) ?? emptyTotals())]))
  return { dates, position: new Map(dates.map((date, i) => [date, i])), byChannel }
})

export const TRACKING_GAP = { lookbackDays: 7, minClicksShare: 0.7, maxOrdersShare: 0.25, minDailyOrders: 10 } as const

export interface GapDay {
  index: number
  clicks: number
  orders: number
  avgClicks: number
  avgOrders: number
  /** Prior-week average revenue: what the day would likely have recorded with working tracking. */
  avgRevenue: number
}

/** Days where clicks look normal against the prior week but orders all but vanish. */
export const trackingGaps = memoByDataset((data: Dataset): ReadonlyMap<ChannelKey, ReadonlyMap<number, GapDay>> => {
  const { byChannel } = dailyIndex(data)
  const { lookbackDays, minClicksShare, maxOrdersShare, minDailyOrders } = TRACKING_GAP
  const result = new Map<ChannelKey, Map<number, GapDay>>()
  for (const [channel, days] of byChannel) {
    const gaps = new Map<number, GapDay>()
    for (let i = lookbackDays; i < days.length; i++) {
      const prior = days.slice(i - lookbackDays, i)
      const avgClicks = prior.reduce((sum, d) => sum + d.clicks, 0) / lookbackDays
      const avgOrders = prior.reduce((sum, d) => sum + d.orders, 0) / lookbackDays
      const avgRevenue = prior.reduce((sum, d) => sum + d.revenue, 0) / lookbackDays
      const day = days[i]
      if (!day || avgOrders < minDailyOrders) continue
      if (day.clicks >= minClicksShare * avgClicks && day.orders <= maxOrdersShare * avgOrders) {
        gaps.set(i, { index: i, clicks: day.clicks, orders: day.orders, avgClicks, avgOrders, avgRevenue })
      }
    }
    result.set(channel, gaps)
  }
  return result
})

const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

/**
 * Revenue anomaly residuals. Each channel's revenue is taken as a share of the rest of the business
 * (which cancels seasonality: Black Friday lifts everyone), compared with its median share on the same
 * weekday over the previous four weeks (which cancels send-day patterns), on a log scale. A channel
 * with a tracking gap that day counts at its prior-week average, so one broken pixel doesn't make
 * every other channel look like it spiked.
 */
export const revenueResiduals = memoByDataset((data: Dataset): ReadonlyMap<ChannelKey, readonly (number | null)[]> => {
  const { dates, byChannel } = dailyIndex(data)
  const gaps = trackingGaps(data)
  const revenue = (channel: ChannelKey, i: number) => byChannel.get(channel)?.[i]?.revenue ?? 0

  const share = (channel: ChannelKey, i: number) => {
    let rest = 0
    for (const other of CHANNEL_KEYS) {
      if (other !== channel) rest += gaps.get(other)?.get(i)?.avgRevenue ?? revenue(other, i)
    }
    return rest > 0 ? revenue(channel, i) / rest : 0
  }

  const result = new Map<ChannelKey, (number | null)[]>()
  for (const channel of CHANNEL_KEYS) {
    const shares = dates.map((_, i) => share(channel, i))
    result.set(
      channel,
      shares.map((value, i) => {
        if (i < 28 || value <= 0) return null
        const expected = median([7, 14, 21, 28].map((k) => shares[i - k] ?? 0))
        return expected > 0 ? Math.log(value / expected) : null
      }),
    )
  }
  return result
})

export const ANOMALY = { minZ: 3, minChange: 0.5, historyDays: 28, minHistory: 20 } as const

/** z-score of day i's residual against the residuals of the previous 28 days. */
export function anomalyZ(residuals: readonly (number | null)[], i: number): number | null {
  const value = residuals[i]
  if (value == null) return null
  const history = residuals.slice(Math.max(0, i - ANOMALY.historyDays), i).filter((r): r is number => r !== null)
  if (history.length < ANOMALY.minHistory) return null
  const mean = history.reduce((sum, r) => sum + r, 0) / history.length
  const sd = Math.sqrt(history.reduce((sum, r) => sum + (r - mean) ** 2, 0) / history.length)
  return sd > 0 ? (value - mean) / sd : null
}
