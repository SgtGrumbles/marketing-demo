import { STORYLINES } from './config'
import type { ChannelKey } from './types'

// Storylines that change how a day is simulated. Post-hoc storylines live in storylines.ts.

const progress = (value: number, span: number) => Math.min(1, Math.max(0, value / span))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t

/** TikTok launched recently: spend and conversion efficiency both climb over the ramp. */
export function tiktokRamp(channel: ChannelKey, daysAgo: number): { spend: number; efficiency: number } {
  if (channel !== 'tiktok') return { spend: 1, efficiency: 1 }
  const { launchDaysAgo, rampDays, spendFrom, efficiencyFrom } = STORYLINES.tiktokRamp
  const t = progress(launchDaysAgo - daysAgo, rampDays)
  const easeOut = 1 - (1 - t) ** 2
  return { spend: lerp(spendFrom, 1, t), efficiency: lerp(efficiencyFrom, 1, easeOut) }
}

/**
 * Creative fatigue on one Meta creative: over the window, frequency climbs, CTR falls, and CPA rises
 * by less than CTR falls (the people who still click are higher-intent).
 */
export function creativeEffect(
  campaignId: string,
  creativeName: string,
  daysAgo: number,
): { ctr: number; cvr: number; frequency?: number } {
  const fatigue = STORYLINES.creativeFatigue
  if (campaignId !== fatigue.campaignId || creativeName !== fatigue.creativeName || daysAgo > fatigue.windowDays) {
    return { ctr: 1, cvr: 1 }
  }
  // daysAgo runs windowDays → 1 across the window; t runs 0 → 1.
  const t = (fatigue.windowDays - daysAgo) / (fatigue.windowDays - 1)
  const ctr = 1 - fatigue.ctrDrop * t
  const ordersPerImpression = 1 / (1 + fatigue.cpaRise * t)
  return {
    ctr,
    cvr: ordersPerImpression / ctr,
    frequency: lerp(fatigue.frequencyFrom, fatigue.frequencyTo, t),
  }
}
