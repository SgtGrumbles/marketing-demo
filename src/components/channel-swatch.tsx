import type { ChannelKey } from '@/data/types'
import { channelColor } from '@/lib/channels'
import { cn } from '@/lib/utils'

/** The channel's color as a small square, always shown next to its name. */
export function ChannelSwatch({ channel, className }: { channel: ChannelKey; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', className)}
      style={{ backgroundColor: channelColor(channel) }}
    />
  )
}
