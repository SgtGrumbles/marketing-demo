import { addDays, differenceInCalendarDays, format, lastDayOfMonth } from 'date-fns'
import { STORYLINES } from './config'

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** The nth (1-based) given weekday of a month, or the last one when n is -1. Months are 0-based. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n === -1) {
    const last = lastDayOfMonth(new Date(year, month, 1))
    return addDays(last, -((last.getDay() - weekday + 7) % 7))
  }
  const first = new Date(year, month, 1)
  return addDays(first, ((weekday - first.getDay() + 7) % 7) + (n - 1) * 7)
}

/** The day after the fourth Thursday of November. */
export function blackFriday(year: number): Date {
  return addDays(nthWeekday(year, 10, 4, 4), 1)
}

/** US retail sale days, which get an email promo blast. */
export function retailHolidays(year: number): { date: Date; name: string }[] {
  const bf = blackFriday(year)
  return [
    { date: nthWeekday(year, 4, 1, -1), name: 'Memorial Day' },
    { date: new Date(year, 6, 4), name: 'Independence Day' },
    { date: nthWeekday(year, 8, 1, 1), name: 'Labor Day' },
    { date: bf, name: 'Black Friday' },
    { date: addDays(bf, 3), name: 'Cyber Monday' },
  ]
}

export function promoDays(year: number): Date[] {
  return retailHolidays(year).map((holiday) => holiday.date)
}

/** "Cyber Monday" for 2025-12-01, or undefined. */
export function holidayName(isoDate: string): string | undefined {
  const year = Number(isoDate.slice(0, 4))
  return retailHolidays(year).find((holiday) => toISODate(holiday.date) === isoDate)?.name
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * Math.min(1, Math.max(0, t))

// January dip, spring bump, flat summer, then the Q4 ramp handled in seasonFactor.
const MONTH_BASELINE = [0.78, 0.88, 1, 1.12, 1.08, 1, 1, 0.98, 1, 1.08, 1.1, 0.85]

/**
 * Spend/volume multiplier for a date: ramps through November, peaks Black Friday → Cyber Monday,
 * then decays through December.
 */
export function seasonFactor(date: Date): number {
  const peak = STORYLINES.holidayPeak.spendMultiple
  const fromBlackFriday = differenceInCalendarDays(date, blackFriday(date.getFullYear()))
  if (fromBlackFriday >= 0 && fromBlackFriday <= 3) return peak
  if (fromBlackFriday >= -35 && fromBlackFriday < 0) return lerp(1.08, 2, (fromBlackFriday + 35) / 34)
  if (fromBlackFriday > 3 && fromBlackFriday <= 33) return lerp(1.7, 0.85, (fromBlackFriday - 4) / 29)
  return MONTH_BASELINE[date.getMonth()] ?? 1
}

// Exponent chosen so that the peak's spend multiple produces the peak's revenue multiple.
const EFFICIENCY_EXPONENT =
  Math.log(STORYLINES.holidayPeak.revenueMultiple) / Math.log(STORYLINES.holidayPeak.spendMultiple) - 1

/** Conversion lift in busy periods: shoppers buy more readily in peak season. */
export function seasonEfficiency(season: number): number {
  return season ** EFFICIENCY_EXPONENT
}
