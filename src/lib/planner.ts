import { PLANNER_CURVES } from '@/data/config'
import { CHANNEL_KEYS, type ChannelKey, type Dataset } from '@/data/types'
import { filterFacts, totalsByChannel } from '@/lib/aggregate'
import { dataBounds, resolveRange, type DateRange } from '@/lib/date-range'
import { memoByDataset } from '@/lib/memo'
import { aov, emptyTotals, percentChange, roas, type Totals } from '@/lib/metrics'

// Budget planner: per-channel response curves calibrated to the last 30 days, projections, lock-total
// rebalancing and a greedy optimizer. Real arithmetic over hand-set curves, not a fitted model.

export type PlannerChannel = keyof typeof PLANNER_CURVES
export type Allocation = Readonly<Record<PlannerChannel, number>>

export const PLANNER_CHANNELS = CHANNEL_KEYS.filter((key): key is PlannerChannel => key in PLANNER_CURVES)

/** Channels with spend that the planner holds at their last-30-day level (organic has no spend). */
export const FIXED_CHANNELS: readonly ChannelKey[] = ['email', 'affiliate']

/** How far a slider goes, as a multiple of the channel's current spend. */
const MAX_SPEND_MULTIPLE = 2.5

export interface ResponseCurve {
  channel: PlannerChannel
  /** Revenue ceiling. */
  a: number
  /** Spend scale: at spend = b the channel earns 63% of its ceiling. */
  b: number
  current: Totals
  /** Revenue per order, held constant so orders scale with revenue. */
  aov: number
  maxSpend: number
}

export function curveRevenue(curve: Pick<ResponseCurve, 'a' | 'b'>, spend: number): number {
  return curve.a * (1 - Math.exp(-spend / curve.b))
}

/** Revenue from the next dollar at this spend level. */
export function marginalRoas(curve: Pick<ResponseCurve, 'a' | 'b'>, spend: number): number {
  return (curve.a / curve.b) * Math.exp(-spend / curve.b)
}

/** Solves a and b so the curve passes through (spend, revenue) with spend at the given shoulder. */
export function calibrateCurve(spend: number, revenue: number, shoulder: number): { a: number; b: number } {
  return { a: revenue / (1 - Math.exp(-shoulder)), b: spend / shoulder }
}

const niceCeil = (value: number, step: number) => Math.max(step, Math.ceil(value / step) * step)

export interface PlannerBaseline {
  range: DateRange
  curves: Readonly<Record<PlannerChannel, ResponseCurve>>
  fixed: readonly { channel: ChannelKey; totals: Totals }[]
  allocation: Allocation
}

/** The last 30 days of data, and a curve per planner channel through it. */
export const plannerBaseline = memoByDataset((data: Dataset): PlannerBaseline => {
  const range = resolveRange('30d', dataBounds(data))
  const byChannel = totalsByChannel(filterFacts(data.facts, range, CHANNEL_KEYS))
  const current = (channel: ChannelKey) => byChannel.get(channel) ?? emptyTotals()

  const curves = Object.fromEntries(
    PLANNER_CHANNELS.map((channel) => {
      const totals = current(channel)
      const curve: ResponseCurve = {
        channel,
        ...calibrateCurve(totals.spend, totals.revenue, PLANNER_CURVES[channel].shoulder),
        current: totals,
        aov: aov(totals) ?? 0,
        maxSpend: niceCeil(totals.spend * MAX_SPEND_MULTIPLE, 10_000),
      }
      return [channel, curve]
    }),
  ) as Record<PlannerChannel, ResponseCurve>

  return {
    range,
    curves,
    fixed: FIXED_CHANNELS.map((channel) => ({ channel, totals: current(channel) })),
    allocation: mapChannels((channel) => curves[channel].current.spend),
  }
})

export function mapChannels(value: (channel: PlannerChannel) => number): Allocation {
  return Object.fromEntries(PLANNER_CHANNELS.map((channel) => [channel, value(channel)])) as Record<PlannerChannel, number>
}

export function allocationTotal(allocation: Allocation): number {
  return PLANNER_CHANNELS.reduce((sum, channel) => sum + allocation[channel], 0)
}

export interface ProjectedResult {
  spend: number
  revenue: number
  orders: number
  roas: number | null
}

export interface Projection extends ProjectedResult {
  channel: ChannelKey
  fixed: boolean
}

const result = (spend: number, revenue: number, orders: number): ProjectedResult => ({ spend, revenue, orders, roas: roas({ spend, revenue }) })

export interface PlanProjection {
  rows: Projection[]
  total: ProjectedResult
}

/** Projected results per channel for an allocation; fixed channels carry their last 30 days. */
export function projectPlan(baseline: PlannerBaseline, allocation: Allocation): PlanProjection {
  const rows = [
    ...PLANNER_CHANNELS.map((channel) => {
      const curve = baseline.curves[channel]
      const spend = allocation[channel]
      const revenue = curveRevenue(curve, spend)
      return { channel, fixed: false, ...result(spend, revenue, curve.aov > 0 ? revenue / curve.aov : 0) }
    }),
    ...baseline.fixed.map(({ channel, totals }) => ({ channel, fixed: true, ...result(totals.spend, totals.revenue, totals.orders) })),
  ]
  const sum = (field: 'spend' | 'revenue' | 'orders') => rows.reduce((total, row) => total + row[field], 0)
  return { rows, total: result(sum('spend'), sum('revenue'), sum('orders')) }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Sets one channel and, with the total locked, spreads the difference across the others in
 * proportion to their current budgets, respecting each slider's range.
 */
export function rebalance(baseline: PlannerBaseline, allocation: Allocation, channel: PlannerChannel, value: number, lockTotal: boolean): Allocation {
  const maxOf = (key: PlannerChannel) => baseline.curves[key].maxSpend
  if (!lockTotal) return { ...allocation, [channel]: clamp(value, 0, maxOf(channel)) }

  const total = allocationTotal(allocation)
  const others = PLANNER_CHANNELS.filter((key) => key !== channel)
  const target = clamp(value, Math.max(0, total - others.reduce((sum, key) => sum + maxOf(key), 0)), Math.min(maxOf(channel), total))
  const next: Record<PlannerChannel, number> = { ...allocation, [channel]: target }

  // Proportional fill; a channel that hits its limit is pinned there and the rest re-split.
  let free = others
  while (free.length > 0) {
    const pinned = others.filter((key) => !free.includes(key)).reduce((sum, key) => sum + next[key], 0)
    const remaining = total - target - pinned
    const weight = free.reduce((sum, key) => sum + allocation[key], 0)
    const overflowing = free.filter((key) => {
      next[key] = remaining * (weight > 0 ? allocation[key] / weight : 1 / free.length)
      return next[key] > maxOf(key)
    })
    if (overflowing.length === 0) break
    for (const key of overflowing) next[key] = maxOf(key)
    free = free.filter((key) => !overflowing.includes(key))
  }
  return next
}

export const OPTIMIZE_STEP = 500

/**
 * Splits a fixed total by greedy marginal return: each $500 goes to the channel whose curve earns
 * the most from it. Curves are concave, so this lands where marginal ROAS is equal across channels.
 */
export function optimizeAllocation(baseline: PlannerBaseline, total: number): Allocation {
  const next = mapChannels(() => 0) as Record<PlannerChannel, number>
  let left = Math.min(total, PLANNER_CHANNELS.reduce((sum, key) => sum + baseline.curves[key].maxSpend, 0))
  while (left > 0) {
    const step = Math.min(OPTIMIZE_STEP, left)
    let best: PlannerChannel | undefined
    let bestGain = -Infinity
    for (const channel of PLANNER_CHANNELS) {
      const curve = baseline.curves[channel]
      const room = Math.min(step, curve.maxSpend - next[channel])
      if (room <= 0) continue
      const gain = (curveRevenue(curve, next[channel] + room) - curveRevenue(curve, next[channel])) / room
      if (gain > bestGain) [best, bestGain] = [channel, gain]
    }
    if (!best) break
    const room = Math.min(step, baseline.curves[best].maxSpend - next[best])
    next[best] += room
    left -= room
  }
  return next
}

/** Evenly spaced points along a curve from zero to its slider maximum, for charting. */
export function curvePoints(curve: ResponseCurve, count = 60): { spend: number; revenue: number }[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const spend = (curve.maxSpend * i) / count
    return { spend, revenue: curveRevenue(curve, spend) }
  })
}

/** Share of the curve's revenue ceiling reached at this spend: how close the channel is to saturating. */
export function saturation(curve: Pick<ResponseCurve, 'a' | 'b'>, spend: number): number {
  return curveRevenue(curve, spend) / curve.a
}

/** Proposed vs current, treating float noise from rebalancing as no change. */
export function planChange(proposed: number | null, current: number | null): number | null {
  const change = percentChange(proposed, current)
  return change !== null && Math.abs(change) < 1e-6 ? 0 : change
}
