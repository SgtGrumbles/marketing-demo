import { CHANNEL_MODELS, type CampaignSpec, type ChannelModel } from './config'
import { jitter, type Rng } from './prng'
import { creativeEffect, tiktokRamp } from './effects'
import type { CreativeDaily, DailyFact } from './types'

export interface DayContext {
  date: Date
  iso: string
  daysAgo: number
  /** Retail-calendar multiplier on volume. */
  season: number
  /** Retail-calendar multiplier on conversion. */
  seasonEfficiency: number
}

export interface SimulatedDay {
  fact: DailyFact
  creativeFacts: CreativeDaily[]
}

interface DeliveryPart {
  creativeId?: string
  share: number
  ctr: number
  cvr: number
  frequency?: number
}

const round2 = (value: number) => Math.round(value * 100) / 100

export function creativeId(campaignId: string, index: number): string {
  return `${campaignId}-cr${index + 1}`
}

export function isSpendDriven(model: ChannelModel): boolean {
  return model.costModel === 'cpc' || model.costModel === 'cpm'
}

/** One campaign-day under normal conditions: volume and efficiency from season, growth, weekday and noise. */
export function simulateCampaignDay(spec: CampaignSpec, day: DayContext, rng: Rng): SimulatedDay {
  const model = CHANNEL_MODELS[spec.channel]
  const ramp = tiktokRamp(spec.channel, day.daysAgo)
  const weekday = (spec.weekday ?? model.weekday)[day.date.getDay()] ?? 1
  const growth = model.annualGrowth ** (-day.daysAgo / 365)

  const volume =
    spec.daily * day.season ** model.seasonality * growth * weekday * ramp.spend * jitter(rng, model.noise)
  const efficiency = spec.efficiency * day.seasonEfficiency * ramp.efficiency * jitter(rng, model.noise / 2)

  return buildDay(spec, day, volume, efficiency, rng)
}

/**
 * Turns a day's volume (spend for paid media, clicks otherwise) into a full, monotonic funnel.
 * Campaigns with creatives are simulated per creative and summed, so the two always reconcile.
 */
export function buildDay(
  spec: CampaignSpec,
  day: DayContext,
  volume: number,
  efficiency: number,
  rng: Rng,
): SimulatedDay {
  const model = CHANNEL_MODELS[spec.channel]
  const unitCost = model.unitCost ?? 1
  const spendDriven = isSpendDriven(model)

  const budget = spendDriven ? volume : (spec.dailyCost ?? 0)
  const reach = spendDriven
    ? model.costModel === 'cpc'
      ? volume / unitCost / model.ctr
      : (volume / unitCost) * 1000
    : volume / model.ctr
  const ordersPerClick = model.sessionRate * model.addToCartRate * model.checkoutRate * efficiency

  const fact: DailyFact = {
    date: day.iso,
    campaignId: spec.id,
    channel: spec.channel,
    impressions: 0,
    clicks: 0,
    spend: 0,
    sessions: 0,
    addToCarts: 0,
    orders: 0,
    revenue: 0,
    newCustomers: 0,
  }
  const creativeFacts: CreativeDaily[] = []

  for (const part of deliveryParts(spec, day, rng)) {
    const impressions = Math.round(reach * part.share)
    const clicks = Math.min(impressions, Math.round(impressions * model.ctr * part.ctr * jitter(rng, model.noise / 2)))
    const orders = Math.round(clicks * ordersPerClick * part.cvr)
    const revenue = round2(orders * model.aov * jitter(rng, 0.04))
    const spend = round2(budget * part.share)

    fact.impressions += impressions
    fact.clicks += clicks
    fact.orders += orders
    fact.revenue += revenue
    fact.spend += spend

    if (part.creativeId && part.frequency !== undefined) {
      creativeFacts.push({ date: day.iso, creativeId: part.creativeId, impressions, clicks, spend, orders, revenue, frequency: part.frequency })
    }
  }

  fact.revenue = round2(fact.revenue)
  fact.spend = model.costModel === 'commission' ? round2(fact.revenue * (model.commissionRate ?? 0)) : round2(fact.spend)

  const sessionRate = Math.min(0.95, model.sessionRate * jitter(rng, 0.03))
  fact.sessions = Math.max(fact.orders, Math.round(fact.clicks * sessionRate))
  const addToCarts = Math.round(fact.sessions * model.addToCartRate * efficiency * jitter(rng, 0.05))
  fact.addToCarts = Math.min(fact.sessions, Math.max(fact.orders, addToCarts))
  fact.newCustomers = Math.min(fact.orders, Math.round(fact.orders * model.newCustomerRate * jitter(rng, 0.1)))

  return { fact, creativeFacts }
}

/** Splits delivery across the creatives live that day, or a single part for campaigns without creatives. */
function deliveryParts(spec: CampaignSpec, day: DayContext, rng: Rng): DeliveryPart[] {
  if (!spec.creatives) return [{ share: 1, ctr: 1, cvr: 1 }]

  const live = spec.creatives
    .map((creative, index) => ({ creative, id: creativeId(spec.id, index) }))
    .filter(({ creative }) => creative.startDaysAgo === undefined || day.daysAgo <= creative.startDaysAgo)
  const totalWeight = live.reduce((sum, { creative }) => sum + creative.weight, 0)

  return live.map(({ creative, id }) => {
    const effect = creativeEffect(spec.id, creative.name, day.daysAgo)
    return {
      creativeId: id,
      share: creative.weight / totalWeight,
      ctr: (creative.ctr ?? 1) * effect.ctr,
      cvr: (creative.cvr ?? 1) * effect.cvr,
      frequency: round2(effect.frequency ?? creative.frequency * jitter(rng, 0.06)),
    }
  })
}
