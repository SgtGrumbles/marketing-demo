import { Check, FlaskConical, RotateCcw, Sparkles } from 'lucide-react'
import { BudgetSliders } from '@/components/planner/budget-sliders'
import { PlanSummary } from '@/components/planner/plan-summary'
import { ProjectionTable } from '@/components/planner/projection-table'
import { ResponseCurveChart } from '@/components/planner/response-curve-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDataset } from '@/data/generate'
import { formatDateRange } from '@/lib/format'
import { allocationTotal, OPTIMIZE_STEP, optimizeAllocation, PLANNER_CHANNELS, plannerBaseline, projectPlan, type Allocation } from '@/lib/planner'
import { usePlannerStore } from '@/store/planner'

/** Allocations within half an optimizer step of each other count as the same plan. */
const samePlan = (a: Allocation, b: Allocation) => PLANNER_CHANNELS.every((channel) => Math.abs(a[channel] - b[channel]) < OPTIMIZE_STEP / 2)

export function PlannerPage() {
  const baseline = plannerBaseline(getDataset())
  const { allocation, animating, animateTo, reset } = usePlannerStore()
  const current = projectPlan(baseline, baseline.allocation)
  const proposed = projectPlan(baseline, allocation)
  const optimal = optimizeAllocation(baseline, allocationTotal(allocation))
  const isOptimal = samePlan(allocation, optimal)
  const isBaseline = samePlan(allocation, baseline.allocation)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
          <FlaskConical className="size-3" aria-hidden />
          Projections from modeled response curves
        </Badge>
        <span className="text-sm text-muted-foreground">
          Calibrated to the last 30 days, {formatDateRange(baseline.range.from, baseline.range.to)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={reset} disabled={isBaseline || animating}>
            <RotateCcw aria-hidden />
            Reset
          </Button>
          <Button onClick={() => animateTo(optimal)} disabled={isOptimal || animating} data-testid="optimize">
            {isOptimal && !animating ? <Check aria-hidden /> : <Sparkles aria-hidden />}
            {isOptimal && !animating ? 'Optimized' : 'Optimize'}
          </Button>
        </div>
      </div>
      <PlanSummary proposed={proposed.total} current={current.total} />
      <div className="grid gap-6 2xl:grid-cols-2">
        <BudgetSliders baseline={baseline} />
        <ProjectionTable proposed={proposed} current={current} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANNER_CHANNELS.map((channel) => (
          <ResponseCurveChart key={channel} curve={baseline.curves[channel]} proposed={allocation[channel]} />
        ))}
      </div>
    </div>
  )
}
