import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { NoDataState } from '@/components/no-data-state'
import { InsightCard } from '@/components/insights/insight-card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { INSIGHT_TYPES, type InsightType } from '@/lib/insights'
import { useFilteredData } from '@/store/use-filtered-data'
import { useInsights } from '@/store/use-insights'

export function InsightsPage() {
  const insights = useInsights()
  const [type, setType] = useState<InsightType | 'all'>('all')
  const visible = type === 'all' ? insights : insights.filter((insight) => insight.type === type)
  const count = (key: InsightType) => insights.filter((insight) => insight.type === key).length
  const { facts, filters, range } = useFilteredData()
  if (facts.length === 0) return <NoDataState channels={filters.channels} range={range} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={type}
          onValueChange={(value) => setType(INSIGHT_TYPES.find((t) => t.key === value)?.key ?? 'all')}
          aria-label="Insight type"
        >
          <ToggleGroupItem value="all">All · {insights.length}</ToggleGroupItem>
          {INSIGHT_TYPES.map(({ key, label }) => (
            <ToggleGroupItem key={key} value={key} disabled={count(key) === 0}>
              {label} · {count(key)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-sm text-muted-foreground">Rule-based detection over the selected range and channels</p>
      </div>

      {visible.length ? (
        <div className="grid gap-4" data-testid="insight-list">
          {visible.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <CircleCheck className="size-8" />
          No insights for these filters.
        </div>
      )}
    </div>
  )
}
