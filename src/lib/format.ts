import { addDays, format, parseISO } from 'date-fns'

// All displayed numbers and dates go through this module.

export const MISSING = '—'
const MINUS = '−' // true minus sign (U+2212)

export type ValueFormat = 'currency' | 'unitCost' | 'percent' | 'multiplier' | 'count'

type Value = number | null | undefined

const isMissing = (value: Value): value is null | undefined => value == null || !Number.isFinite(value)

const currencyFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const currencyCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const currencyCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const countFull = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const countCompact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** $1.2M · $84.3K · $912 (tiles and axes) */
export function formatCurrencyCompact(value: Value): string {
  if (isMissing(value)) return MISSING
  const dollars = Math.round(value)
  return Math.abs(dollars) < 1000 ? currencyFull.format(dollars) : currencyCompact.format(dollars)
}

/** $84,312 (tables and tooltips) */
export function formatCurrency(value: Value): string {
  return isMissing(value) ? MISSING : currencyFull.format(value)
}

/** $1.23 (CPC, CPA, CPM, AOV, CAC) */
export function formatUnitCost(value: Value): string {
  return isMissing(value) ? MISSING : currencyCents.format(value)
}

/** 0.034 → 3.4% */
export function formatPercent(value: Value): string {
  return isMissing(value) ? MISSING : `${oneDecimal.format(value * 100)}%`
}

/** 3.2x (ROAS, MER) */
export function formatMultiplier(value: Value): string {
  return isMissing(value) ? MISSING : `${oneDecimal.format(value)}x`
}

/** 12,345 */
export function formatCount(value: Value): string {
  return isMissing(value) ? MISSING : countFull.format(value)
}

/** 12.3K */
export function formatCountCompact(value: Value): string {
  return isMissing(value) ? MISSING : countCompact.format(value)
}

/** 0.124 → +12.4%, −0.031 → −3.1% */
export function formatDelta(value: Value): string {
  if (isMissing(value)) return MISSING
  const percent = oneDecimal.format(Math.abs(value) * 100)
  if (percent === '0.0') return '0.0%'
  return `${value > 0 ? '+' : MINUS}${percent}%`
}

/** Formats a metric value; compact applies to currency and counts (tiles, axes). */
export function formatValue(kind: ValueFormat, value: Value, options: { compact?: boolean } = {}): string {
  switch (kind) {
    case 'currency':
      return options.compact ? formatCurrencyCompact(value) : formatCurrency(value)
    case 'unitCost':
      return formatUnitCost(value)
    case 'percent':
      return formatPercent(value)
    case 'multiplier':
      return formatMultiplier(value)
    case 'count':
      return options.compact ? formatCountCompact(value) : formatCount(value)
  }
}

const toDate = (date: string | Date) => (typeof date === 'string' ? parseISO(date) : date)

/** Nov 17 */
export function formatDateAxis(date: string | Date): string {
  return format(toDate(date), 'MMM d')
}

/** Nov 17, 2026 */
export function formatDateTooltip(date: string | Date): string {
  return format(toDate(date), 'MMM d, yyyy')
}

/** Nov 5 – Dec 4, 2025 · Dec 28, 2024 – Jan 3, 2025 · Dec 4, 2025 */
export function formatDateRange(from: string | Date, to: string | Date): string {
  const start = toDate(from)
  const end = toDate(to)
  if (start.getTime() === end.getTime()) return formatDateTooltip(end)
  const sameYear = start.getFullYear() === end.getFullYear()
  return `${sameYear ? formatDateAxis(start) : formatDateTooltip(start)} – ${formatDateTooltip(end)}`
}

/** A series point's span: "Nov 17, 2026" for a day, "Nov 28 – Dec 4, 2025" for a bucket of days. */
export function formatPeriod(start: string, days: number): string {
  return days <= 1 ? formatDateTooltip(start) : formatDateRange(start, addDays(toDate(start), days - 1))
}

/** "just now", "4 min ago", "2 hr ago" */
export function formatTimeAgo(from: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - from.getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} hr ago`
}
