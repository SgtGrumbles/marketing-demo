import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DropOff, FunnelStage } from '@/lib/funnel'
import { formatCount, formatCountCompact, formatDateRange, formatDelta, formatPercent } from '@/lib/format'
import { deltaTone, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'

const TONE_CLASS = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' } as const

interface FunnelStagesProps {
  stages: readonly FunnelStage[]
  dropOff: DropOff | null
  showPrevious: boolean
  range: { from: string; to: string }
}

/**
 * Stage counts span ~1000×, so bars don't scale to counts. Each bar is 100% of the previous stage,
 * split into the share that continued and the share that dropped, which keeps every step readable.
 */
export function FunnelStages({ stages, dropOff, showPrevious, range }: FunnelStagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion funnel</CardTitle>
        <CardDescription>{formatDateRange(range.from, range.to)} · each bar is 100% of the stage before it</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1" role="table" aria-label="Funnel stages">
          <div role="row" className="grid grid-cols-[8rem_6rem_1fr_5rem_5rem] items-center gap-4 px-3 pb-2 text-xs text-muted-foreground">
            <span role="columnheader">Stage</span>
            <span role="columnheader" className="text-right">Count</span>
            <span role="columnheader">Continued from previous stage</span>
            <span role="columnheader" className="text-right">Step rate</span>
            <span role="columnheader" className="text-right">{showPrevious ? 'vs prior' : ''}</span>
          </div>
          {stages.map((stage) => {
            const isDropOff = dropOff?.to === stage.key
            const change = showPrevious ? percentChange(stage.stepRate, stage.previousStepRate) : null
            return (
              <div
                key={stage.key}
                role="row"
                data-stage={stage.key}
                data-dropoff={isDropOff || undefined}
                className={cn('grid grid-cols-[8rem_6rem_1fr_5rem_5rem] items-center gap-4 rounded-lg px-3 py-3', isDropOff && 'bg-warning/10 ring-1 ring-warning/40')}
              >
                <span role="cell" className="font-medium">{stage.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="cell" className="text-right text-lg font-semibold">{formatCountCompact(stage.count)}</span>
                  </TooltipTrigger>
                  <TooltipContent>{formatCount(stage.count)}</TooltipContent>
                </Tooltip>
                <span role="cell">
                  <StepBar stage={stage} />
                </span>
                <span role="cell" className="text-right font-medium">{stage.stepRate === null ? 'Entry' : formatPercent(stage.stepRate)}</span>
                <span role="cell" className={cn('text-right text-sm', TONE_CLASS[deltaTone('up', change)])}>{change === null ? '' : formatDelta(change)}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function StepBar({ stage }: { stage: FunnelStage }) {
  const share = stage.stepRate ?? 1
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(share * 100, 0.75)}%` }} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {stage.stepRate === null
          ? `${formatCount(stage.count)} people entered the funnel`
          : `${formatPercent(stage.stepRate)} continued · ${formatCount(stage.lost)} dropped`}
      </TooltipContent>
    </Tooltip>
  )
}
