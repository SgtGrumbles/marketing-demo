import { PlanDelta } from '@/components/planner/plan-delta'
import { Card } from '@/components/ui/card'
import { formatValue } from '@/lib/format'
import { METRICS } from '@/lib/metrics'
import type { ProjectedResult } from '@/lib/planner'

const TILES = [
  { key: 'spend', label: 'Monthly budget' },
  { key: 'revenue', label: 'Projected revenue' },
  { key: 'roas', label: 'Projected ROAS' },
  { key: 'orders', label: 'Projected orders' },
] as const

/** The plan's totals, each against the last 30 days. */
export function PlanSummary({ proposed, current }: { proposed: ProjectedResult; current: ProjectedResult }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map(({ key, label }) => {
        const { format } = METRICS[key]
        const compact = format === 'currency'
        return (
          <Card key={key} className="gap-1 px-4 py-4" data-plan-total={key}>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-[28px] leading-9 font-semibold tracking-tight tabular-nums" data-value>
              {formatValue(format, proposed[key], { compact })}
            </div>
            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              <PlanDelta metric={key} proposed={proposed[key]} current={current[key]} className="text-sm" />
              <span className="text-muted-foreground">from {formatValue(format, current[key], { compact })}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
