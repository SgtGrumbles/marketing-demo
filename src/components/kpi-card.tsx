import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '@/components/charts/sparkline'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SERIES_COLORS } from '@/lib/channels'
import { formatDelta, formatValue } from '@/lib/format'
import type { Comparison, KpiSummary } from '@/lib/summaries'
import { cn } from '@/lib/utils'

const TONE_CLASS = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' } as const

interface KpiCardProps {
  summary: KpiSummary
  comparison: Comparison
  /** e.g. "Oct 6 – Nov 4, 2025" */
  previousLabel: string
}

export function KpiCard({ summary, comparison, previousLabel }: KpiCardProps) {
  const { label, format, value, change, tone, trend, key } = summary
  const DeltaIcon = change !== null && change < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <Card className="gap-1 overflow-visible px-4 py-4" data-kpi={key}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-[28px] leading-9 font-semibold tracking-tight" data-value>
        {formatValue(format, value, { compact: format === 'currency' })}
      </div>
      <div className="flex h-5 items-center gap-1 text-sm whitespace-nowrap">
        {comparison === 'on' && change !== null ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('flex items-center gap-0.5 font-medium', TONE_CLASS[tone])} data-delta>
                <DeltaIcon className="size-4" aria-hidden />
                {formatDelta(change)}
              </span>
            </TooltipTrigger>
            <TooltipContent>vs {previousLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">{comparison === 'incomplete' ? 'No full prior period' : ' '}</span>
        )}
        {comparison === 'on' && change !== null && <span className="hidden text-muted-foreground 2xl:inline">vs prior</span>}
      </div>
      <Sparkline data={trend} label={label} format={format} color={key === 'spend' ? SERIES_COLORS.spend : SERIES_COLORS.revenue} />
    </Card>
  )
}
