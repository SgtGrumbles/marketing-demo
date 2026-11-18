import { useState } from 'react'
import { parseISO } from 'date-fns'
import { CalendarDays, Check } from 'lucide-react'
import type { DateRange as PickerRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toISODate } from '@/data/calendar'
import { presetLabel, QUICK_PRESETS } from '@/lib/date-range'
import { formatDateRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/store/filters'
import { useFilteredData } from '@/store/use-filtered-data'

export function DateRangePicker() {
  const { data, filters, range } = useFilteredData()
  const setPreset = useFilterStore((state) => state.setPreset)
  const setCustomRange = useFilterStore((state) => state.setCustomRange)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PickerRange | undefined>()

  const firstDay = parseISO(data.startDate)
  const lastDay = parseISO(data.endDate)
  const selected = draft ?? { from: parseISO(range.from), to: parseISO(range.to) }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    setDraft(undefined)
  }

  const applyCustom = () => {
    if (!draft?.from || !draft.to) return
    setCustomRange(toISODate(draft.from), toISODate(draft.to))
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <CalendarDays className="text-muted-foreground" />
          <span className="font-medium">{presetLabel(filters.range)}</span>
          <span className="hidden text-muted-foreground lg:inline">{formatDateRange(range.from, range.to)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto flex-row gap-0 p-0">
        <div className="flex w-40 flex-col gap-0.5 border-r p-2">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant="ghost"
              size="sm"
              className={cn('justify-between font-normal', filters.range === preset.key && 'font-semibold')}
              onClick={() => {
                setPreset(preset.key)
                onOpenChange(false)
              }}
            >
              {preset.label}
              {filters.range === preset.key && <Check className="size-4" />}
            </Button>
          ))}
        </div>
        <div className="flex flex-col">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            // The first click after opening starts a new range rather than editing the current one.
            onSelect={(next, clicked) => setDraft(draft ? next : { from: clicked, to: undefined })}
            defaultMonth={parseISO(range.from)}
            startMonth={firstDay}
            endMonth={lastDay}
            disabled={[{ before: firstDay }, { after: lastDay }]}
          />
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
            <span className="text-sm text-muted-foreground">
              {draft?.from ? formatDateRange(draft.from, draft.to ?? draft.from) : 'Pick a start and end date'}
            </span>
            <Button size="sm" disabled={!draft?.from || !draft.to} onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
