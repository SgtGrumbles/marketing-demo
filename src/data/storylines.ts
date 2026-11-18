import { getDaysInMonth, startOfMonth } from 'date-fns'
import { toISODate } from './calendar'
import { CAMPAIGN_SPECS, CHANNEL_MODELS, STORYLINES } from './config'
import { uniform, type Rng } from './prng'
import { buildDay, isSpendDriven, type DayContext, type SimulatedDay } from './simulate'
import type { Campaign, DailyFact } from './types'

// Storylines applied after the baseline simulation. In-simulation storylines live in effects.ts.

const round2 = (value: number) => Math.round(value * 100) / 100

/** A one-day tracking outage: clicks and spend are normal, but most orders never get recorded. */
export function applyTrackingOutage(facts: DailyFact[], days: readonly DayContext[]): void {
  const { channel, daysAgo, orderLoss } = STORYLINES.trackingOutage
  const day = days.find((d) => d.daysAgo === daysAgo)
  if (!day) return

  for (const fact of facts) {
    if (fact.date !== day.iso || fact.channel !== channel) continue
    const orders = Math.round(fact.orders * (1 - orderLoss))
    fact.revenue = fact.orders === 0 ? 0 : round2((fact.revenue * orders) / fact.orders)
    fact.newCustomers = Math.min(orders, Math.round(fact.newCustomers * (1 - orderLoss)))
    fact.orders = orders
  }
}

/** A promo send that lifts the email channel to a multiple of its trailing 28-day average. */
export function emailPromoDay(facts: readonly DailyFact[], days: readonly DayContext[], rng: Rng): SimulatedDay | null {
  const { campaignId, daysAgo, multiple } = STORYLINES.emailPromo
  const spec = CAMPAIGN_SPECS.find((s) => s.id === campaignId)
  const day = days.find((d) => d.daysAgo === daysAgo)
  if (!spec || !day) return null

  const trailing = new Set(days.filter((d) => d.daysAgo > daysAgo && d.daysAgo <= daysAgo + 28).map((d) => d.iso))
  let trailingRevenue = 0
  let revenueToday = 0
  for (const fact of facts) {
    if (fact.channel !== 'email') continue
    if (trailing.has(fact.date)) trailingRevenue += fact.revenue
    if (fact.date === day.iso) revenueToday += fact.revenue
  }

  const model = CHANNEL_MODELS.email
  const efficiency = spec.efficiency * day.seasonEfficiency
  const revenuePerClick = model.sessionRate * model.addToCartRate * model.checkoutRate * efficiency * model.aov
  const promoRevenue = (trailingRevenue / trailing.size) * multiple - revenueToday
  return buildDay(spec, day, promoRevenue / revenuePerClick, efficiency, rng)
}

/**
 * Monthly budgets for live paid campaigns, set so month-to-date pacing lands near plan,
 * except the one campaign that is deliberately running hot.
 */
export function assignBudgets(campaigns: readonly Campaign[], facts: readonly DailyFact[], lastDay: Date, rng: Rng): Campaign[] {
  const monthStart = toISODate(startOfMonth(lastDay))
  const expectedShare = lastDay.getDate() / getDaysInMonth(lastDay)

  const monthToDate = new Map<string, number>()
  for (const fact of facts) {
    if (fact.date >= monthStart) monthToDate.set(fact.campaignId, (monthToDate.get(fact.campaignId) ?? 0) + fact.spend)
  }

  return campaigns.map((campaign) => {
    if (campaign.status !== 'active' || !isSpendDriven(CHANNEL_MODELS[campaign.channel])) return campaign
    const pacing = campaign.id === STORYLINES.overBudget.campaignId ? STORYLINES.overBudget.pacing : uniform(rng, 0.86, 1.04)
    const spend = monthToDate.get(campaign.id) ?? 0
    const monthlyBudget = Math.round(spend / expectedShare / pacing / 100) * 100
    return { ...campaign, monthlyBudget }
  })
}
