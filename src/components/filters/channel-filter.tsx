import { ChevronDown } from 'lucide-react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CHANNEL_KEYS } from '@/data/types'
import { CHANNEL_LIST, channelLabel, PAID_CHANNELS } from '@/lib/channels'
import { useFilterStore } from '@/store/filters'

export function ChannelFilter() {
  const channels = useFilterStore((state) => state.filters.channels)
  const setChannels = useFilterStore((state) => state.setChannels)

  const allSelected = channels.length === CHANNEL_KEYS.length
  const [only] = channels
  const summary = allSelected ? 'All channels' : channels.length === 1 && only ? channelLabel(only) : `${channels.length} channels`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <span className="flex -space-x-0.5">
            {channels.map((key) => (
              <ChannelSwatch key={key} channel={key} className="ring-2 ring-background" />
            ))}
          </span>
          <span className="font-medium">{summary}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Channels</DropdownMenuLabel>
        {CHANNEL_LIST.map(({ key, label }) => {
          const checked = channels.includes(key)
          return (
            <DropdownMenuCheckboxItem
              key={key}
              checked={checked}
              // At least one channel stays selected.
              disabled={checked && channels.length === 1}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(next) => setChannels(next ? [...channels, key] : channels.filter((c) => c !== key))}
            >
              <ChannelSwatch channel={key} />
              {label}
            </DropdownMenuCheckboxItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setChannels(CHANNEL_KEYS)}>All channels</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setChannels(PAID_CHANNELS)}>Paid media only</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
