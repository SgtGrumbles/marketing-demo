import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateRange } from '@/lib/format'
import { useFilterStore } from '@/store/filters'
import { useFilteredData } from '@/store/use-filtered-data'

export function CompareToggle() {
  const { filters, previous } = useFilteredData()
  const setCompare = useFilterStore((state) => state.setCompare)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Switch id="compare-toggle" checked={filters.compare} onCheckedChange={setCompare} />
          <Label htmlFor="compare-toggle" className="cursor-pointer font-normal whitespace-nowrap">
            Compare
          </Label>
        </div>
      </TooltipTrigger>
      <TooltipContent>Compare to previous period: {formatDateRange(previous.from, previous.to)}</TooltipContent>
    </Tooltip>
  )
}
