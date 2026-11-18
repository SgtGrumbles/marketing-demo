import { Link } from 'react-router'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { channelLabel } from '@/lib/channels'
import { filterSearch } from '@/lib/filter-params'
import { formatCount, formatPercent } from '@/lib/format'
import type { DropOff } from '@/lib/funnel'
import { useFilterStore } from '@/store/filters'

export function DropOffCallout({ dropOff }: { dropOff: DropOff | null }) {
  const filters = useFilterStore((state) => state.filters)

  return (
    <Card className="h-full" data-testid="drop-off">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-4 text-warning" aria-hidden />
          Biggest drop-off
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {dropOff ? (
          <>
            <div>
              <div className="text-2xl font-semibold tracking-tight">{dropOff.label}</div>
              <p className="mt-1 text-muted-foreground">
                Only {formatPercent(dropOff.rate)} continue: {formatCount(dropOff.lost)} leave at this step
                {dropOff.previousRate !== null && <>, compared with {formatPercent(dropOff.previousRate)} last period</>}.
              </p>
            </div>
            {dropOff.weakest && (
              <div className="grid gap-3 rounded-lg border p-3">
                <p className="flex items-start gap-2 text-sm">
                  <ChannelSwatch channel={dropOff.weakest.channel} className="mt-1" />
                  <span>
                    <span className="font-medium">{channelLabel(dropOff.weakest.channel)}</span> converts lowest here at{' '}
                    {formatPercent(dropOff.weakest.rate)}, against {formatPercent(dropOff.rate)} blended.
                  </span>
                </p>
                <Button variant="outline" size="sm" className="justify-self-start" asChild>
                  <Link to={{ pathname: `/channels/${dropOff.weakest.channel}`, search: filterSearch(filters) }}>
                    View {channelLabel(dropOff.weakest.channel)}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Not enough traffic in this range to compare steps.</p>
        )}
      </CardContent>
    </Card>
  )
}
