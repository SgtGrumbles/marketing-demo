import { CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CHANNEL_KEYS, type ChannelKey } from '@/data/types'
import { channelLabel } from '@/lib/channels'
import { coverage } from '@/lib/coverage'
import type { DateRange } from '@/lib/date-range'
import { formatDateRange } from '@/lib/format'
import { useFilterStore } from '@/store/filters'
import { useFilteredData } from '@/store/use-filtered-data'

const listChannels = (channels: readonly ChannelKey[]) =>
  channels.length === CHANNEL_KEYS.length ? 'All channels' : new Intl.ListFormat('en-US').format(channels.map(channelLabel))

interface NoDataStateProps {
  channels: readonly ChannelKey[]
  range: DateRange
  /** Offer "All channels" (off on a single-channel page, where the route picks the channel). */
  canWidenChannels?: boolean
}

/** Shown in place of a page when the filters select no rows, with a way back to data. */
export function NoDataState({ channels, range, canWidenChannels = true }: NoDataStateProps) {
  const { data } = useFilteredData()
  const { setPreset, setChannels } = useFilterStore()
  const span = coverage(data, channels)
  const subject = listChannels(channels)
  const plural = channels.length > 1 && channels.length < CHANNEL_KEYS.length

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 text-center" data-testid="no-data">
      <CalendarX2 className="size-10 text-muted-foreground" aria-hidden />
      <div className="grid gap-1.5">
        <h2 className="text-lg font-semibold">No data for these filters</h2>
        <p className="max-w-lg text-muted-foreground">
          {subject} {plural ? 'have' : 'has'} no activity in {formatDateRange(range.from, range.to)}.
          {span && ` ${subject} data runs from ${formatDateRange(span.from, span.to)}.`}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => setPreset('30d')}>Show last 30 days</Button>
        {canWidenChannels && channels.length < CHANNEL_KEYS.length && (
          <Button variant="outline" onClick={() => setChannels(CHANNEL_KEYS)}>
            All channels
          </Button>
        )}
      </div>
    </div>
  )
}
