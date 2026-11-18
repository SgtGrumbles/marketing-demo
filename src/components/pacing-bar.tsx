import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { pacingTone, type Pacing } from '@/lib/campaigns'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILL = { over: 'bg-destructive', under: 'bg-warning', 'on-track': 'bg-primary' } as const

/** Budget used so far, with a tick where spend should be by today. */
export function PacingBar({ pacing, className }: { pacing: Pacing | null; className?: string }) {
  if (!pacing) return <span className="text-sm text-muted-foreground">—</span>
  const tone = pacingTone(pacing.pacing)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('grid w-32 gap-1', className)} data-pacing={tone}>
          <div className="relative h-2 rounded-full bg-muted">
            <div className={cn('h-full rounded-full', FILL[tone])} style={{ width: `${Math.min(pacing.usedShare, 1) * 100}%` }} />
            <div aria-hidden className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-foreground/60" style={{ left: `${pacing.expectedShare * 100}%` }} />
          </div>
          <div className={cn('text-xs', tone === 'over' ? 'font-medium text-destructive' : 'text-muted-foreground')}>
            {formatPercent(pacing.pacing)} of plan
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {formatCurrency(pacing.monthToDate)} of {formatCurrency(pacing.budget)} spent ({formatPercent(pacing.usedShare)}) with {formatPercent(pacing.expectedShare)} of the month gone · projected {formatCurrency(pacing.projected)}
      </TooltipContent>
    </Tooltip>
  )
}
