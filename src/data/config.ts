import type { ChannelKey, CreativeFormat, Objective } from './types'

/*
 * Everything specific to the fictional company lives in this file: identity, channel economics,
 * the campaign roster and the planted storylines. Swap the company by editing this file only.
 *
 * Dates are written as "days before asOfDate", so campaign names, storylines and the TikTok
 * launch all move together if the anchor date changes. Holidays use the real calendar.
 */

export const COMPANY = {
  name: 'Fernleaf Supply Co.',
  description: 'Outdoor and home goods: camping gear, blankets, drinkware',
}

export const DATA_CONFIG = {
  seed: 20251205,
  /** The dashboard's "today". Pinned so every rehearsal and the stage show the same numbers. */
  asOfDate: '2025-12-05',
  /** Days of history, ending the day before asOfDate (~18 months). */
  historyDays: 540,
}

/** Sunday-first day-of-week multipliers. */
export type Weekday = readonly [number, number, number, number, number, number, number]

export type CostModel = 'cpc' | 'cpm' | 'fixed' | 'commission' | 'none'

export interface ChannelModel {
  costModel: CostModel
  /** Cost per click (cpc) or per thousand impressions (cpm). */
  unitCost?: number
  /** Share of revenue paid as commission (affiliate). */
  commissionRate?: number
  ctr: number
  /** Sessions per click. */
  sessionRate: number
  /** Add-to-carts per session, before campaign and seasonal efficiency. */
  addToCartRate: number
  /** Orders per add-to-cart. */
  checkoutRate: number
  aov: number
  newCustomerRate: number
  /** Daily multiplicative noise, e.g. 0.1 = ±10%. */
  noise: number
  /** How strongly volume follows the retail calendar (1 = fully). */
  seasonality: number
  annualGrowth: number
  weekday: Weekday
}

export const CHANNEL_MODELS: Record<ChannelKey, ChannelModel> = {
  search: {
    costModel: 'cpc', unitCost: 1.15, ctr: 0.052, sessionRate: 0.92, addToCartRate: 0.12, checkoutRate: 0.48,
    aov: 88, newCustomerRate: 0.42, noise: 0.08, seasonality: 1, annualGrowth: 1.07,
    weekday: [0.82, 1.06, 1.08, 1.08, 1.06, 1.02, 0.84],
  },
  meta: {
    costModel: 'cpm', unitCost: 12, ctr: 0.0115, sessionRate: 0.88, addToCartRate: 0.09, checkoutRate: 0.4,
    aov: 84, newCustomerRate: 0.58, noise: 0.12, seasonality: 1, annualGrowth: 1.07,
    weekday: [1.14, 0.94, 0.93, 0.94, 0.96, 1.03, 1.12],
  },
  tiktok: {
    costModel: 'cpm', unitCost: 7.5, ctr: 0.0095, sessionRate: 0.86, addToCartRate: 0.1, checkoutRate: 0.38,
    aov: 78, newCustomerRate: 0.72, noise: 0.15, seasonality: 1, annualGrowth: 1.07,
    weekday: [1.12, 0.94, 0.93, 0.95, 0.97, 1.04, 1.1],
  },
  email: {
    costModel: 'fixed', ctr: 0.021, sessionRate: 0.95, addToCartRate: 0.1, checkoutRate: 0.45,
    aov: 92, newCustomerRate: 0.08, noise: 0.12, seasonality: 0.6, annualGrowth: 1.2,
    weekday: [0.9, 1.05, 1.05, 1.05, 1.05, 1, 0.9],
  },
  organic: {
    costModel: 'none', ctr: 0.031, sessionRate: 0.95, addToCartRate: 0.06, checkoutRate: 0.4,
    aov: 82, newCustomerRate: 0.5, noise: 0.08, seasonality: 0.5, annualGrowth: 1.15,
    weekday: [0.92, 1.04, 1.04, 1.03, 1.02, 0.98, 0.95],
  },
  affiliate: {
    costModel: 'commission', commissionRate: 0.1, ctr: 0.015, sessionRate: 0.9, addToCartRate: 0.11,
    checkoutRate: 0.45, aov: 90, newCustomerRate: 0.45, noise: 0.1, seasonality: 0.9, annualGrowth: 1.25,
    weekday: [0.97, 1, 1, 1, 1, 1.02, 1.01],
  },
}

export interface CreativeSpec {
  name: string
  format: CreativeFormat
  /** Share of the campaign's delivery while active. */
  weight: number
  frequency: number
  startDaysAgo?: number
  /** CTR and conversion multipliers relative to the campaign. */
  ctr?: number
  cvr?: number
}

export interface CampaignSpec {
  id: string
  channel: ChannelKey
  objective: Objective
  /** Audience code used in the campaign name. */
  audience: string
  startDaysAgo: number
  end?: { daysAgo: number; status: 'paused' | 'ended' }
  /** Baseline daily spend (search, meta, tiktok) or clicks (email, organic, affiliate) at today's scale. */
  daily: number
  /** Conversion multiplier relative to the channel norm. */
  efficiency: number
  /** Fixed daily platform cost (email). */
  dailyCost?: number
  /** "promo" campaigns only run on promo send days. */
  schedule?: 'daily' | 'promo'
  weekday?: Weekday
  creatives?: readonly CreativeSpec[]
}

export const CAMPAIGN_SPECS: readonly CampaignSpec[] = [
  // Paid Search
  { id: 'search-brand', channel: 'search', objective: 'conversion', audience: 'brand', startDaysAgo: 552, daily: 700, efficiency: 1.9 },
  { id: 'search-nonbrand', channel: 'search', objective: 'conversion', audience: 'nonbrand', startDaysAgo: 552, daily: 1800, efficiency: 0.8 },
  { id: 'search-shopping', channel: 'search', objective: 'conversion', audience: 'shopping', startDaysAgo: 552, daily: 1800, efficiency: 1.05 },
  { id: 'search-competitor', channel: 'search', objective: 'conversion', audience: 'competitor', startDaysAgo: 305, end: { daysAgo: 52, status: 'paused' }, daily: 450, efficiency: 0.7 },
  { id: 'search-holiday-2024', channel: 'search', objective: 'conversion', audience: 'holiday', startDaysAgo: 396, end: { daysAgo: 339, status: 'ended' }, daily: 400, efficiency: 1.1 },
  { id: 'search-holiday-2025', channel: 'search', objective: 'conversion', audience: 'holiday', startDaysAgo: 32, daily: 400, efficiency: 1.1 },

  // Meta
  {
    id: 'meta-lookalike', channel: 'meta', objective: 'conversion', audience: 'lookalike', startDaysAgo: 552, daily: 2600, efficiency: 1,
    creatives: [
      { name: 'Trailhead Pack – Video 01', format: 'video', weight: 0.3, frequency: 1.6 },
      { name: 'Cozy Blanket – Image 02', format: 'image', weight: 0.2, frequency: 1.5, ctr: 0.9 },
      { name: 'Campfire Mug – Carousel', format: 'carousel', weight: 0.15, frequency: 1.4, ctr: 1.1 },
      { name: 'Summer Trail – Video 03', format: 'video', weight: 0.35, frequency: 1.8, startDaysAgo: 186, ctr: 1.15 },
    ],
  },
  {
    id: 'meta-retargeting', channel: 'meta', objective: 'conversion', audience: 'retargeting', startDaysAgo: 552, daily: 1300, efficiency: 1.35,
    creatives: [
      { name: 'Cart Reminder – Carousel', format: 'carousel', weight: 0.5, frequency: 2.1 },
      { name: 'Best Sellers – Image 01', format: 'image', weight: 0.3, frequency: 1.9 },
      { name: 'Reviews – Video 02', format: 'video', weight: 0.2, frequency: 2 },
    ],
  },
  {
    id: 'meta-broad', channel: 'meta', objective: 'awareness', audience: 'broad', startDaysAgo: 552, end: { daysAgo: 219, status: 'ended' }, daily: 900, efficiency: 0.5,
    creatives: [
      { name: 'Brand Story – Video 01', format: 'video', weight: 0.5, frequency: 1.3 },
      { name: 'Basecamp – Image 03', format: 'image', weight: 0.3, frequency: 1.2 },
      { name: 'Spring Gear – Carousel', format: 'carousel', weight: 0.2, frequency: 1.2, startDaysAgo: 280 },
    ],
  },
  {
    id: 'meta-prospecting', channel: 'meta', objective: 'conversion', audience: 'prospecting', startDaysAgo: 277, daily: 1400, efficiency: 0.9,
    creatives: [
      { name: 'Weekend Escape – Video 04', format: 'video', weight: 0.45, frequency: 1.5 },
      { name: 'Hammock – Image 05', format: 'image', weight: 0.25, frequency: 1.4 },
      { name: 'Starter Kit – Carousel', format: 'carousel', weight: 0.3, frequency: 1.5, cvr: 1.1 },
    ],
  },
  {
    id: 'meta-interest', channel: 'meta', objective: 'traffic', audience: 'interest', startDaysAgo: 552, end: { daysAgo: 98, status: 'paused' }, daily: 700, efficiency: 0.6,
    creatives: [
      { name: 'Outdoor Living – Image 06', format: 'image', weight: 0.4, frequency: 1.4 },
      { name: 'Fireside – Video 05', format: 'video', weight: 0.35, frequency: 1.5 },
      { name: 'Trail Picks – Carousel', format: 'carousel', weight: 0.25, frequency: 1.3 },
    ],
  },
  {
    id: 'meta-holiday', channel: 'meta', objective: 'conversion', audience: 'holiday', startDaysAgo: 25, daily: 450, efficiency: 1.05,
    creatives: [
      { name: 'Gift Guide – Carousel', format: 'carousel', weight: 0.4, frequency: 1.4, cvr: 1.1 },
      { name: 'Holiday Cabin – Video 06', format: 'video', weight: 0.35, frequency: 1.3 },
      { name: 'Stocking Stuffers – Image 07', format: 'image', weight: 0.25, frequency: 1.3 },
    ],
  },

  // TikTok (launched 120 days ago, still ramping)
  {
    id: 'tiktok-broad', channel: 'tiktok', objective: 'awareness', audience: 'broad', startDaysAgo: 120, daily: 450, efficiency: 0.7,
    creatives: [
      { name: 'Unboxing – UGC Video 01', format: 'video', weight: 0.4, frequency: 1.3 },
      { name: 'Camp Hacks – Video 02', format: 'video', weight: 0.35, frequency: 1.4, ctr: 1.15 },
      { name: 'Cozy Night – Video 03', format: 'video', weight: 0.25, frequency: 1.2 },
    ],
  },
  {
    id: 'tiktok-spark', channel: 'tiktok', objective: 'conversion', audience: 'spark', startDaysAgo: 120, daily: 700, efficiency: 1.1,
    creatives: [
      { name: 'Creator Review – Spark 01', format: 'video', weight: 0.45, frequency: 1.5, cvr: 1.1 },
      { name: 'Trail Day – Spark 02', format: 'video', weight: 0.3, frequency: 1.4 },
      { name: 'Mug Pour – Spark 03', format: 'video', weight: 0.25, frequency: 1.3 },
    ],
  },
  {
    id: 'tiktok-creator', channel: 'tiktok', objective: 'conversion', audience: 'creator', startDaysAgo: 81, daily: 550, efficiency: 1.05,
    creatives: [
      { name: 'Creator Haul – Video 04', format: 'video', weight: 0.4, frequency: 1.4 },
      { name: 'Blanket Fort – Video 05', format: 'video', weight: 0.35, frequency: 1.3, ctr: 1.1 },
      { name: 'Gift Pick – Carousel 01', format: 'carousel', weight: 0.25, frequency: 1.2 },
    ],
  },
  {
    id: 'tiktok-interest', channel: 'tiktok', objective: 'traffic', audience: 'interest', startDaysAgo: 120, end: { daysAgo: 46, status: 'paused' }, daily: 300, efficiency: 0.6,
    creatives: [
      { name: 'Quick Tips – Video 06', format: 'video', weight: 0.6, frequency: 1.3 },
      { name: 'Gear Check – Image 01', format: 'image', weight: 0.4, frequency: 1.2 },
    ],
  },

  // Email: sends on Tue/Thu, always-on flows, and promo blasts on sale days
  { id: 'email-newsletter', channel: 'email', objective: 'retention', audience: 'newsletter', startDaysAgo: 552, daily: 300, efficiency: 1, dailyCost: 28, weekday: [0.05, 0.05, 3.3, 0.05, 3.3, 0.05, 0.05] },
  { id: 'email-flows', channel: 'email', objective: 'retention', audience: 'flows', startDaysAgo: 552, daily: 150, efficiency: 1, dailyCost: 22 },
  { id: 'email-promo', channel: 'email', objective: 'conversion', audience: 'promo', startDaysAgo: 552, daily: 2200, efficiency: 1.1, dailyCost: 0, schedule: 'promo' },

  // Organic and affiliate
  { id: 'organic-search', channel: 'organic', objective: 'traffic', audience: 'seo', startDaysAgo: 552, daily: 880, efficiency: 1 },
  { id: 'affiliate-partners', channel: 'affiliate', objective: 'conversion', audience: 'partners', startDaysAgo: 552, daily: 400, efficiency: 1 },
  { id: 'affiliate-creators', channel: 'affiliate', objective: 'conversion', audience: 'creators', startDaysAgo: 326, daily: 220, efficiency: 0.9 },
]

/** The six planted storylines (see docs/DATA.md). */
export const STORYLINES = {
  creativeFatigue: {
    campaignId: 'meta-lookalike', creativeName: 'Summer Trail – Video 03',
    windowDays: 21, frequencyFrom: 1.8, frequencyTo: 4.6, ctrDrop: 0.44, cpaRise: 0.4,
  },
  tiktokRamp: { launchDaysAgo: 120, rampDays: 110, spendFrom: 0.3, efficiencyFrom: 0.37 },
  trackingOutage: { channel: 'search' as ChannelKey, daysAgo: 9, orderLoss: 0.9 },
  emailPromo: { campaignId: 'email-promo', daysAgo: 4, multiple: 3.5 },
  holidayPeak: { spendMultiple: 2.5, revenueMultiple: 3 },
  overBudget: { campaignId: 'search-shopping', pacing: 1.15 },
} as const

/**
 * Budget planner response curves: monthly revenue = a × (1 − e^(−spend / b)). Each channel's
 * shoulder is where its last-30-day spend sits on the curve (spend / b). The planner solves a and b
 * from it so the curve passes through the actual last 30 days. A low shoulder means headroom
 * (TikTok); a high one means saturation (Meta). Channels not listed stay fixed in the planner.
 */
export const PLANNER_CURVES = {
  search: { shoulder: 1.1 },
  meta: { shoulder: 1.6 },
  tiktok: { shoulder: 0.45 },
} as const satisfies Partial<Record<ChannelKey, { shoulder: number }>>
