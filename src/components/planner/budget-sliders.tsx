import type { CSSProperties } from 'react'
import { Lock } from 'lucide-react'
import { BudgetInput } from '@/components/planner/budget-input'
import { ChannelSwatch } from '@/components/channel-swatch'
import { PlanDelta } from '@/components/planner/plan-delta'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { channelColor, channelLabel } from '@/lib/channels'
import { formatCurrency, formatCurrencyCompact } from '@/lib/format'
import { allocationTotal, PLANNER_CHANNELS, type PlannerBaseline } from '@/lib/planner'
import { usePlannerStore } from '@/store/planner'

const SLIDER_STEP = 1_000

export function BudgetSliders({ baseline }: { baseline: PlannerBaseline }) {
  const { allocation, lockTotal, setBudget, setLockTotal } = usePlannerStore()
  const fixedSpend = baseline.fixed.reduce((sum, { totals }) => sum + totals.spend, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly budget</CardTitle>
        <CardDescription>Drag a slider or type an amount</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Switch id="lock-total" checked={lockTotal} onCheckedChange={setLockTotal} />
            <Label htmlFor="lock-total" className="flex items-center gap-1 font-normal">
              <Lock className="size-3.5 text-muted-foreground" aria-hidden />
              Lock total
            </Label>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        {PLANNER_CHANNELS.map((channel) => {
          const curve = baseline.curves[channel]
          const label = channelLabel(channel)
          return (
            <div key={channel} className="grid grid-cols-[minmax(7rem,9rem)_1fr_7.5rem] items-center gap-x-4 gap-y-1" data-budget={channel}>
              <div className="flex items-center gap-2 font-medium">
                <ChannelSwatch channel={channel} />
                {label}
              </div>
              <Slider
                aria-label={`${label} budget`}
                min={0}
                max={curve.maxSpend}
                step={SLIDER_STEP}
                value={[allocation[channel]]}
                onValueChange={([value]) => value !== undefined && setBudget(channel, value)}
                className="[&_[data-slot=slider-range]]:bg-(--channel) [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-(--channel) [&_[data-slot=slider-track]]:h-1.5"
                style={{ '--channel': channelColor(channel) } as CSSProperties}
              />
              <BudgetInput value={allocation[channel]} label={`${label} budget in dollars`} onCommit={(value) => setBudget(channel, value)} />
              <div className="col-start-2 flex justify-between text-xs text-muted-foreground">
                <span>Current {formatCurrencyCompact(curve.current.spend)}</span>
                <span>Max {formatCurrencyCompact(curve.maxSpend)}</span>
              </div>
              <PlanDelta metric="spend" proposed={allocation[channel]} current={curve.current.spend} className="text-right" />
            </div>
          )
        })}
        <div className="grid gap-1.5 border-t pt-4 text-sm">
          {baseline.fixed.map(({ channel, totals }) => (
            <div key={channel} className="flex items-center gap-2 text-muted-foreground">
              <ChannelSwatch channel={channel} />
              {channelLabel(channel)}
              <span className="ml-auto tabular-nums">{formatCurrency(totals.spend)}</span>
              <span className="w-[7.5rem] text-right text-xs">held fixed</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 font-medium">
            Total
            {lockTotal && <Lock className="size-3.5 text-muted-foreground" aria-label="Locked" />}
            <span className="ml-auto tabular-nums" data-budget-total>{formatCurrency(allocationTotal(allocation) + fixedSpend)}</span>
            <span className="w-[7.5rem]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
