import { useNavigate } from 'react-router'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ChannelKey } from '@/data/types'
import { CHANNEL_LIST } from '@/lib/channels'
import { filterSearch } from '@/lib/filter-params'
import { useFilterStore } from '@/store/filters'

export function ChannelTabs({ value }: { value: ChannelKey }) {
  const navigate = useNavigate()
  const filters = useFilterStore((state) => state.filters)

  return (
    <Tabs value={value} onValueChange={(next) => navigate({ pathname: `/channels/${next}`, search: filterSearch(filters) })}>
      <TabsList>
        {CHANNEL_LIST.map(({ key, label }) => (
          <TabsTrigger key={key} value={key} className="gap-2 px-3">
            <ChannelSwatch channel={key} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
