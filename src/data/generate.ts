import { format, parseISO, subDays } from 'date-fns'
import { promoDays, seasonEfficiency, seasonFactor, toISODate } from './calendar'
import { CAMPAIGN_SPECS, DATA_CONFIG, STORYLINES, type CampaignSpec } from './config'
import { mulberry32, seedFrom } from './prng'
import { creativeId, simulateCampaignDay, type DayContext, type SimulatedDay } from './simulate'
import { applyTrackingOutage, assignBudgets, emailPromoDay } from './storylines'
import type { Campaign, Creative, CreativeDaily, DailyFact, Dataset, Objective } from './types'

const OBJECTIVE_CODE: Record<Objective, string> = {
  awareness: 'awareness',
  traffic: 'traffic',
  conversion: 'conv',
  retention: 'retention',
}

/** Builds the full dataset from the seed. Pure and deterministic; use getDataset() in the app. */
export function generateDataset(): Dataset {
  const asOf = parseISO(DATA_CONFIG.asOfDate)
  const days = buildDays(asOf)
  const rngFor = (key: string) => mulberry32(seedFrom(DATA_CONFIG.seed, key))
  const promoDates = collectPromoDates(days)

  const facts: DailyFact[] = []
  const creativeFacts: CreativeDaily[] = []
  const collect = (day: SimulatedDay | null) => {
    if (!day) return
    facts.push(day.fact)
    creativeFacts.push(...day.creativeFacts)
  }

  const streams = CAMPAIGN_SPECS.map((spec) => ({ spec, rng: rngFor(spec.id) }))
  for (const day of days) {
    for (const { spec, rng } of streams) {
      if (isLive(spec, day, promoDates)) collect(simulateCampaignDay(spec, day, rng))
    }
  }

  applyTrackingOutage(facts, days)
  collect(emailPromoDay(facts, days, rngFor('storyline:email-promo')))

  const lastDay = subDays(asOf, 1)
  const campaigns = assignBudgets(CAMPAIGN_SPECS.map((spec) => toCampaign(spec, asOf)), facts, lastDay, rngFor('budgets'))

  facts.sort((a, b) => a.date.localeCompare(b.date) || a.campaignId.localeCompare(b.campaignId))
  creativeFacts.sort((a, b) => a.date.localeCompare(b.date) || a.creativeId.localeCompare(b.creativeId))

  return {
    asOfDate: DATA_CONFIG.asOfDate,
    startDate: days[0]?.iso ?? DATA_CONFIG.asOfDate,
    endDate: toISODate(lastDay),
    campaigns,
    facts,
    creatives: CAMPAIGN_SPECS.flatMap(toCreatives),
    creativeFacts,
  }
}

let cached: Dataset | undefined

/** The app's single dataset, generated once on first use. */
export function getDataset(): Dataset {
  cached ??= generateDataset()
  return cached
}

/** Oldest first, ending the day before asOf. */
function buildDays(asOf: Date): DayContext[] {
  const days: DayContext[] = []
  for (let daysAgo = DATA_CONFIG.historyDays; daysAgo >= 1; daysAgo--) {
    const date = subDays(asOf, daysAgo)
    const season = seasonFactor(date)
    days.push({ date, iso: toISODate(date), daysAgo, season, seasonEfficiency: seasonEfficiency(season) })
  }
  return days
}

/** Regular promo sends, minus the recent window where the planted promo storyline should stand alone. */
function collectPromoDates(days: readonly DayContext[]): Set<string> {
  const quietDays = STORYLINES.emailPromo.daysAgo + 31
  const years = new Set(days.map((d) => d.date.getFullYear()))
  const recent = new Set(days.filter((d) => d.daysAgo <= quietDays).map((d) => d.iso))
  return new Set(
    [...years].flatMap(promoDays).map(toISODate).filter((iso) => !recent.has(iso)),
  )
}

function isLive(spec: CampaignSpec, day: DayContext, promoDates: ReadonlySet<string>): boolean {
  if (day.daysAgo > spec.startDaysAgo) return false
  if (spec.end && day.daysAgo < spec.end.daysAgo) return false
  if (spec.schedule === 'promo') return promoDates.has(day.iso)
  return true
}

function toCampaign(spec: CampaignSpec, asOf: Date): Campaign {
  const start = subDays(asOf, spec.startDaysAgo)
  return {
    id: spec.id,
    name: `${spec.channel}_${OBJECTIVE_CODE[spec.objective]}_${spec.audience}_${format(start, 'yyyyMM')}`,
    channel: spec.channel,
    objective: spec.objective,
    status: spec.end?.status ?? 'active',
    startDate: toISODate(start),
    ...(spec.end && { endDate: toISODate(subDays(asOf, spec.end.daysAgo)) }),
  }
}

function toCreatives(spec: CampaignSpec): Creative[] {
  return (spec.creatives ?? []).map((creative, index) => ({
    id: creativeId(spec.id, index),
    campaignId: spec.id,
    name: creative.name,
    format: creative.format,
  }))
}
