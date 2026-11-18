import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { INSIGHT_TYPES, insightHref, type Insight } from '@/lib/insights'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/store/filters'
import { InsightChart } from './insight-chart'
import { SeverityBadge } from './severity-badge'

const typeLabel = (type: Insight['type']) => INSIGHT_TYPES.find((t) => t.key === type)?.label ?? type

/** Full card for the Insights page; `compact` drops the chart for the Overview preview. */
export function InsightCard({ insight, compact = false }: { insight: Insight; compact?: boolean }) {
  const filters = useFilterStore((state) => state.filters)

  return (
    <Card className={cn('gap-0 overflow-visible', compact ? 'px-4 py-3' : 'p-5')} data-insight={insight.type} data-severity={insight.severity}>
      <div className={cn('grid gap-5', !compact && 'md:grid-cols-[1fr_16rem]')}>
        <div className={cn('grid content-start', compact ? 'gap-1.5' : 'gap-2')}>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={insight.severity} />
            <span className="text-xs text-muted-foreground">{typeLabel(insight.type)}</span>
          </div>
          <h3 className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-base')}>{insight.title}</h3>
          <p className={cn('text-muted-foreground', compact ? 'line-clamp-2 text-sm' : 'text-sm leading-relaxed')}>{insight.body}</p>
          <Button variant="ghost" size="sm" className="-ml-2 justify-self-start" asChild>
            <Link to={insightHref(insight.link, filters)}>
              View
              <ArrowRight />
            </Link>
          </Button>
        </div>
        {!compact && (
          <div className="self-center">
            <InsightChart chart={insight.chart} label={`${insight.title} chart`} />
          </div>
        )}
      </div>
    </Card>
  )
}
