// npm run data:check — prints totals and verifies the generator against docs/DATA.md.
// npm run data:check -- --from 2025-11-05 --to 2025-12-04 also prints totals for that range.
import { format, getDaysInMonth, parseISO, subDays } from 'date-fns'
import { blackFriday, toISODate } from '@/data/calendar'
import { STORYLINES } from '@/data/config'
import { generateDataset } from '@/data/generate'
import type { ChannelKey, DailyFact } from '@/data/types'
import { CHANNEL_LIST } from '@/lib/channels'
import { formatCount, formatCurrency, formatCurrencyCompact, formatDelta, formatMultiplier, formatPercent, formatUnitCost } from '@/lib/format'
import { budgetPacing, cpa, ctr, cvr, mer, percentChange, ratio, roas, sumTotals } from '@/lib/metrics'

// --- generate and time -------------------------------------------------------------------------
let start = performance.now()
const data = generateDataset()
const coldMs = performance.now() - start
const warmRuns = Array.from({ length: 5 }, () => {
  start = performance.now()
  generateDataset()
  return performance.now() - start
}).sort((a, b) => a - b)
const warmMs = warmRuns[2] ?? 0

const asOf = parseISO(data.asOfDate)
const isoDaysAgo = (n: number) => toISODate(subDays(asOf, n))
const between = (from: string, to: string) => (f: DailyFact) => f.date >= from && f.date <= to
const lastNDays = (n: number) => between(isoDaysAgo(n), data.endDate)
const totals = (...filters: ((f: DailyFact) => boolean)[]) => sumTotals(data.facts.filter((f) => filters.every((keep) => keep(f))))
const onChannel = (channel: ChannelKey) => (f: DailyFact) => f.channel === channel

// --- summary tables ----------------------------------------------------------------------------
console.log(`\nPulse data check — ${data.facts.length.toLocaleString()} facts, ${data.creativeFacts.length.toLocaleString()} creative rows, ${data.campaigns.length} campaigns`)
console.log(`Range ${data.startDate} → ${data.endDate} (as of ${data.asOfDate}). Generation: ${coldMs.toFixed(0)} ms cold, ${warmMs.toFixed(0)} ms warm.\n`)

const year = totals(lastNDays(365))
console.log('Last 365 days by channel')
console.table(
  CHANNEL_LIST.map(({ key, label }) => {
    const t = totals(lastNDays(365), onChannel(key))
    return {
      channel: label,
      spend: formatCurrency(t.spend),
      revenue: formatCurrency(t.revenue),
      ROAS: formatMultiplier(roas(t)),
      orders: formatCount(t.orders),
      CPA: formatUnitCost(cpa(t)),
      CVR: formatPercent(cvr(t)),
      'spend share': formatPercent(ratio(t.spend, year.spend)),
    }
  }),
)
console.log(`Total: spend ${formatCurrency(year.spend)}, revenue ${formatCurrency(year.revenue)}, MER ${formatMultiplier(mer(year))}\n`)

const months = [...new Set(data.facts.map((f) => f.date.slice(0, 7)))]
console.log('By month (all channels)')
console.table(
  months.map((month) => {
    const t = totals((f) => f.date.startsWith(month))
    return { month, spend: formatCurrencyCompact(t.spend), revenue: formatCurrencyCompact(t.revenue), MER: formatMultiplier(mer(t)), orders: formatCount(t.orders) }
  }),
)

// --- optional range, for reconciling with the UI ----------------------------------------------
const argument = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}
const rangeFrom = argument('from')
const rangeTo = argument('to')
if (rangeFrom && rangeTo) {
  const inRange = between(rangeFrom, rangeTo)
  console.log(`\nRange ${rangeFrom} → ${rangeTo} by channel`)
  console.table(
    [...CHANNEL_LIST.map(({ key, label }) => ({ label, t: totals(inRange, onChannel(key)) })), { label: 'Total', t: totals(inRange) }].map(({ label, t }) => ({
      channel: label,
      spend: formatCurrency(t.spend),
      revenue: formatCurrency(t.revenue),
      ROAS: formatMultiplier(roas(t)),
      orders: formatCount(t.orders),
      CPA: formatUnitCost(cpa(t)),
    })),
  )
}

// --- checks ------------------------------------------------------------------------------------
const checks: { name: string; pass: boolean; detail: string }[] = []
const check = (name: string, pass: boolean, detail: string) => checks.push({ name, pass, detail })
const within = (value: number | null, min: number, max: number) => value !== null && value >= min && value <= max

check('Generation under 200 ms', coldMs < 200, `${coldMs.toFixed(0)} ms cold`)
check('Deterministic', JSON.stringify(generateDataset()) === JSON.stringify(data), 'two runs produce identical output')

const funnelBreaks = data.facts.filter(
  (f) => !(f.impressions >= f.clicks && f.clicks >= f.sessions && f.sessions >= f.addToCarts && f.addToCarts >= f.orders && f.orders >= f.newCustomers),
)
check('Funnel monotonic', funnelBreaks.length === 0, `${funnelBreaks.length} rows out of order`)

const isCents = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6
const badNumbers = data.facts.filter(
  (f) => ![f.impressions, f.clicks, f.sessions, f.addToCarts, f.orders, f.newCustomers].every(Number.isInteger) || !isCents(f.spend) || !isCents(f.revenue),
)
check('Integer counts, currency in cents', badNumbers.length === 0, `${badNumbers.length} bad rows`)

const paidRows = data.facts.filter((f) => f.channel === 'search' || f.channel === 'meta' || f.channel === 'tiktok')
const paidSessionRate = ratio(sumTotals(paidRows).sessions, sumTotals(paidRows).clicks)
check('Paid sessions 85–95% of clicks', within(paidSessionRate, 0.85, 0.95), formatPercent(paidSessionRate))

const campaignById = new Map(data.campaigns.map((c) => [c.id, c]))
const outOfWindow = data.facts.filter((f) => {
  const c = campaignById.get(f.campaignId)
  return !c || f.date < c.startDate || (c.endDate !== undefined && f.date > c.endDate)
})
check('No rows outside campaign dates', outOfWindow.length === 0, `${outOfWindow.length} rows`)

const creativeCampaign = new Map(data.creatives.map((c) => [c.id, c.campaignId]))
const creativeSums = new Map<string, { clicks: number; spend: number; revenue: number }>()
for (const row of data.creativeFacts) {
  const key = `${row.date}|${creativeCampaign.get(row.creativeId)}`
  const sum = creativeSums.get(key) ?? { clicks: 0, spend: 0, revenue: 0 }
  sum.clicks += row.clicks
  sum.spend += row.spend
  sum.revenue += row.revenue
  creativeSums.set(key, sum)
}
const unreconciled = data.facts.filter((f) => {
  const sum = creativeSums.get(`${f.date}|${f.campaignId}`)
  if (!sum) return f.channel === 'meta' || f.channel === 'tiktok'
  return sum.clicks !== f.clicks || Math.abs(sum.spend - f.spend) > 0.01 || Math.abs(sum.revenue - f.revenue) > 0.01
})
check('Creative rows sum to campaign rows', unreconciled.length === 0, `${unreconciled.length} campaign-days differ`)

const channelRoas = (key: ChannelKey, filter = lastNDays(365)) => roas(totals(filter, onChannel(key)))
check('Annual spend ≈ $4M', within(year.spend, 3.5e6, 4.5e6), formatCurrency(year.spend))
check('Search ROAS 4–6x', within(channelRoas('search'), 4, 6), formatMultiplier(channelRoas('search')))
check('Meta ROAS 2–3.5x', within(channelRoas('meta'), 2, 3.5), formatMultiplier(channelRoas('meta')))
check('Affiliate ROAS ≈ 10x', within(channelRoas('affiliate'), 9.9, 10.1), formatMultiplier(channelRoas('affiliate')))
check('Blended MER 3.5–4x', within(mer(year), 3.5, 4), formatMultiplier(mer(year)))

const recentHalf = totals(lastNDays(175))
const priorHalf = totals(between(isoDaysAgo(175 + 365), isoDaysAgo(366)))
const yoy = percentChange(recentHalf.revenue, priorHalf.revenue)
check('Revenue YoY ≈ +25%', within(yoy, 0.18, 0.32), `${formatDelta(yoy)} (last 175 days vs a year earlier)`)

const { launchDaysAgo } = STORYLINES.tiktokRamp
const tiktokEarly = channelRoas('tiktok', between(isoDaysAgo(launchDaysAgo), isoDaysAgo(launchDaysAgo - 13)))
const tiktokLate = channelRoas('tiktok', lastNDays(14))
check('TikTok ROAS ramps 1.2x → 3.8x', within(tiktokEarly, 0.9, 1.5) && within(tiktokLate, 3.4, 4.2), `${formatMultiplier(tiktokEarly)} first 14 days → ${formatMultiplier(tiktokLate)} last 14 days`)

// Storyline 1: creative fatigue
const fatigue = STORYLINES.creativeFatigue
const fatigued = data.creatives.find((c) => c.campaignId === fatigue.campaignId && c.name === fatigue.creativeName)
const fatigueRows = data.creativeFacts.filter((r) => r.creativeId === fatigued?.id && r.date >= isoDaysAgo(fatigue.windowDays))
const firstDays = fatigueRows.slice(0, 3)
const lastDays = fatigueRows.slice(-3)
const avg = (rows: typeof fatigueRows, pick: (r: (typeof fatigueRows)[number]) => number) => rows.reduce((s, r) => s + pick(r), 0) / rows.length
const sumRows = (rows: typeof fatigueRows) => ({
  impressions: rows.reduce((s, r) => s + r.impressions, 0),
  clicks: rows.reduce((s, r) => s + r.clicks, 0),
  spend: rows.reduce((s, r) => s + r.spend, 0),
  orders: rows.reduce((s, r) => s + r.orders, 0),
})
const ctrChange = percentChange(ctr(sumRows(lastDays)), ctr(sumRows(firstDays)))
const cpaChange = percentChange(cpa(sumRows(lastDays)), cpa(sumRows(firstDays)))
const freqFrom = avg(firstDays, (r) => r.frequency)
const freqTo = avg(lastDays, (r) => r.frequency)
check(
  'S1 Meta creative fatigue',
  fatigueRows.length === fatigue.windowDays && within(ctrChange, -0.45, -0.3) && within(cpaChange, 0.2, 0.5) && freqFrom < 2.1 && freqTo > 4.2,
  `"${fatigue.creativeName}": frequency ${freqFrom.toFixed(1)} → ${freqTo.toFixed(1)}, CTR ${formatDelta(ctrChange)}, CPA ${formatDelta(cpaChange)} (first vs last 3 days)`,
)

// Storyline 2: TikTok quietly winning
const meta30 = totals(lastNDays(30), onChannel('meta'))
const tiktok30 = totals(lastNDays(30), onChannel('tiktok'))
check(
  'S2 TikTok best paid-social ROAS, smallest spend',
  (roas(tiktok30) ?? 0) > (roas(meta30) ?? 0) && tiktok30.spend < meta30.spend,
  `last 30 days: TikTok ${formatMultiplier(roas(tiktok30))} on ${formatCurrencyCompact(tiktok30.spend)} vs Meta ${formatMultiplier(roas(meta30))} on ${formatCurrencyCompact(meta30.spend)}`,
)

// Storyline 3: tracking outage
const outage = STORYLINES.trackingOutage
const outageDay = totals(between(isoDaysAgo(outage.daysAgo), isoDaysAgo(outage.daysAgo)), onChannel(outage.channel))
const priorWeek = totals(between(isoDaysAgo(outage.daysAgo + 7), isoDaysAgo(outage.daysAgo + 1)), onChannel(outage.channel))
const vsWeek = (field: 'orders' | 'clicks' | 'spend') => ratio(outageDay[field], priorWeek[field] / 7)
check(
  'S3 Search tracking outage',
  within(vsWeek('orders'), 0, 0.2) && within(vsWeek('clicks'), 0.75, 1.3) && within(vsWeek('spend'), 0.75, 1.3),
  `${isoDaysAgo(outage.daysAgo)}: orders ${formatPercent(vsWeek('orders'))}, clicks ${formatPercent(vsWeek('clicks'))}, spend ${formatPercent(vsWeek('spend'))} of the prior-week daily average`,
)

// Storyline 4: email promo spike
const promo = STORYLINES.emailPromo
const promoRevenue = totals(between(isoDaysAgo(promo.daysAgo), isoDaysAgo(promo.daysAgo)), onChannel('email')).revenue
const emailTrailing = totals(between(isoDaysAgo(promo.daysAgo + 28), isoDaysAgo(promo.daysAgo + 1)), onChannel('email')).revenue / 28
const promoMultiple = ratio(promoRevenue, emailTrailing)
check('S4 Email promo spike 3–4x', within(promoMultiple, 3, 4), `${isoDaysAgo(promo.daysAgo)}: ${formatCurrency(promoRevenue)} = ${formatMultiplier(promoMultiple)} the trailing 28-day average`)

// Storyline 5: holiday peak, on the real calendar
const bf = blackFriday(asOf.getMonth() >= 10 ? asOf.getFullYear() : asOf.getFullYear() - 1)
const peak = totals(between(toISODate(bf), toISODate(subDays(bf, -3))))
const september = totals((f) => f.date.startsWith(`${bf.getFullYear()}-09`))
const spendLift = ratio(peak.spend / 4, september.spend / 30)
const revenueLift = ratio(peak.revenue / 4, september.revenue / 30)
check(
  'S5 Holiday peak',
  within(spendLift, 2.1, 2.9) && within(revenueLift, 2.5, 3.5),
  `Black Friday–Cyber Monday ${format(bf, 'yyyy')}: spend ${formatMultiplier(spendLift)}, revenue ${formatMultiplier(revenueLift)} a September day`,
)

// Storyline 6: over-budget campaign
const lastDay = parseISO(data.endDate)
const monthStart = data.endDate.slice(0, 8) + '01'
const pacing = data.campaigns
  .filter((c) => c.monthlyBudget !== undefined)
  .map((c) => {
    const spend = totals(between(monthStart, data.endDate), (f) => f.campaignId === c.id).spend
    return { id: c.id, pacing: budgetPacing(spend, c.monthlyBudget ?? 0, lastDay.getDate(), getDaysInMonth(lastDay)) }
  })
const hot = pacing.find((p) => p.id === STORYLINES.overBudget.campaignId)
const othersOk = pacing.filter((p) => p !== hot).every((p) => within(p.pacing, 0.8, 1.06))
check('S6 Over-budget campaign', within(hot?.pacing ?? null, 1.13, 1.17) && othersOk, `${hot?.id} at ${formatPercent(hot?.pacing)}; ${pacing.length - 1} others within 80–106%`)

console.log('\nChecks')
for (const { name, pass, detail } of checks) console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(46)} ${detail}`)
const failed = checks.filter((c) => !c.pass).length
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.')
process.exitCode = failed ? 1 : 0
