import type { ChannelKey } from '@/data/types'
import { METRICS, type MetricKey, type SummedField, type Totals } from '@/lib/metrics'

export type StageKey = Extract<SummedField, 'impressions' | 'clicks' | 'sessions' | 'addToCarts' | 'orders'>

export const FUNNEL_STAGES: readonly { key: StageKey; label: string }[] = [
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'addToCarts', label: 'Add to cart' },
  { key: 'orders', label: 'Orders' },
]

/** Each transition and the metric that measures it. */
export const FUNNEL_STEPS: readonly { from: StageKey; to: StageKey; metric: MetricKey; onSite: boolean }[] = [
  { from: 'impressions', to: 'clicks', metric: 'ctr', onSite: false },
  { from: 'clicks', to: 'sessions', metric: 'landingRate', onSite: true },
  { from: 'sessions', to: 'addToCarts', metric: 'cartRate', onSite: true },
  { from: 'addToCarts', to: 'orders', metric: 'checkoutRate', onSite: true },
]

const stageLabel = (key: StageKey) => FUNNEL_STAGES.find((s) => s.key === key)?.label ?? key

export interface FunnelStage {
  key: StageKey
  label: string
  count: number
  /** Share of the previous stage that reached this one; null for the first stage. */
  stepRate: number | null
  /** Previous-period step rate, when comparing. */
  previousStepRate: number | null
  /** People who left between the previous stage and this one. */
  lost: number
}

export function funnelStages(totals: Totals, previousTotals: Totals | null): FunnelStage[] {
  return FUNNEL_STAGES.map(({ key, label }, index) => {
    const step = FUNNEL_STEPS[index - 1]
    const compute = step ? METRICS[step.metric].compute : null
    return {
      key,
      label,
      count: totals[key],
      stepRate: compute ? compute(totals) : null,
      previousStepRate: compute && previousTotals ? compute(previousTotals) : null,
      lost: step ? totals[step.from] - totals[key] : 0,
    }
  })
}

export interface DropOff {
  metric: MetricKey
  /** The stage people fail to reach. */
  to: StageKey
  label: string
  rate: number
  previousRate: number | null
  lost: number
  /** The selected channel converting worst at this step, if it trails the blend. */
  weakest: { channel: ChannelKey; rate: number } | null
}

/** Channels need a meaningful share of the step's volume before they can be called out. */
const MIN_CHANNEL_SHARE = 0.02

/**
 * The on-site step with the lowest conversion. Impressions → clicks is left out: CTR is always the
 * smallest rate in an ad funnel, so it would win every time and say nothing.
 */
export function biggestDropOff(totals: Totals, previousTotals: Totals | null, byChannel: ReadonlyMap<ChannelKey, Totals>): DropOff | null {
  let worst: DropOff | null = null
  for (const step of FUNNEL_STEPS.filter((s) => s.onSite)) {
    const compute = METRICS[step.metric].compute
    const rate = compute(totals)
    if (rate === null || (worst && rate >= worst.rate)) continue

    let weakest: DropOff['weakest'] = null
    for (const [channel, channelTotals] of byChannel) {
      const channelRate = compute(channelTotals)
      const share = channelTotals[step.from] / Math.max(totals[step.from], 1)
      if (channelRate === null || share < MIN_CHANNEL_SHARE || channelRate >= rate) continue
      if (!weakest || channelRate < weakest.rate) weakest = { channel, rate: channelRate }
    }

    worst = {
      metric: step.metric,
      to: step.to,
      label: `${stageLabel(step.from)} → ${stageLabel(step.to)}`,
      rate,
      previousRate: previousTotals ? compute(previousTotals) : null,
      lost: totals[step.from] - totals[step.to],
      weakest,
    }
  }
  return worst
}
