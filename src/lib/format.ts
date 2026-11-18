// All displayed numbers and dates go through this module. Metric formatters arrive in M1.

/** "just now", "4 min ago", "2 hr ago" */
export function formatTimeAgo(from: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - from.getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} hr ago`
}
