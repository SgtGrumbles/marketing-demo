import { ChannelSwatch } from '@/components/channel-swatch'
import { Badge } from '@/components/ui/badge'
import type { ChannelKey } from '@/data/types'
import { channelLabel } from '@/lib/channels'

export function ChannelBadge({ channel }: { channel: ChannelKey }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <ChannelSwatch channel={channel} className="size-2" />
      {channelLabel(channel)}
    </Badge>
  )
}
