import { ChannelFilter } from './channel-filter'
import { CompareToggle } from './compare-toggle'
import { DateRangePicker } from './date-range-picker'

export function FilterBar() {
  return (
    <div className="flex items-center gap-3">
      <DateRangePicker />
      <ChannelFilter />
      <CompareToggle />
    </div>
  )
}
