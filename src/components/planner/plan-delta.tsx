import { formatDelta } from '@/lib/format'
import { deltaTone, METRICS, type MetricKey } from '@/lib/metrics'
import { planChange } from '@/lib/planner'
import { cn } from '@/lib/utils'

const TONE_CLASS = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' } as const

/** Proposed vs current as a signed percentage, colored by whether the metric is better higher. */
export function PlanDelta({ metric, proposed, current, className }: { metric: MetricKey; proposed: number | null; current: number | null; className?: string }) {
  const change = planChange(proposed, current)
  if (change === null) return null
  return (
    <span className={cn('text-xs font-medium tabular-nums', TONE_CLASS[deltaTone(METRICS[metric].goodDirection, change)], className)} data-delta>
      {change === 0 ? 'No change' : formatDelta(change)}
    </span>
  )
}
