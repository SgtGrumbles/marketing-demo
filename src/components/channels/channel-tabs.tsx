import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ChannelKey } from '@/data/types'
import { CHANNEL_LIST } from '@/lib/channels'
import { filterSearch } from '@/lib/filter-params'
import { useFilterStore } from '@/store/filters'

/** One tab per channel; switching navigates. The page renders inside the active tab's panel. */
export function ChannelTabs({ value, children }: { value: ChannelKey; children: ReactNode }) {
  const navigate = useNavigate()
  const filters = useFilterStore((state) => state.filters)

  return (
    <Tabs value={value} onValueChange={(next) => navigate({ pathname: `/channels/${next}`, search: filterSearch(filters) })} className="min-w-0 gap-6">
      <TabsList>
        {CHANNEL_LIST.map(({ key, label }) => (
          <TabsTrigger key={key} value={key} className="gap-2 px-3">
            <ChannelSwatch channel={key} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={value} className="flex min-w-0 flex-col gap-6">
        {children}
      </TabsContent>
    </Tabs>
  )
}
