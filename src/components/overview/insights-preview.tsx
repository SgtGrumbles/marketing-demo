import { Link } from 'react-router'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { filterSearch } from '@/lib/filter-params'
import { useFilterStore } from '@/store/filters'

// Placeholder until the insights engine lands in M6, which fills this with the top three insights.
export function InsightsPreview() {
  const search = filterSearch(useFilterStore((state) => state.filters))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to={{ pathname: '/insights', search }}>
              View all
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
        <Lightbulb className="size-6 text-muted-foreground" />
        <p className="max-w-56 text-sm text-muted-foreground">Automated insights on anomalies, trends, pacing and creative fatigue arrive in M6.</p>
      </CardContent>
    </Card>
  )
}
