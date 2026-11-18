import { Link } from 'react-router'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { InsightCard } from '@/components/insights/insight-card'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { filterSearch } from '@/lib/filter-params'
import { useFilterStore } from '@/store/filters'
import { useInsights } from '@/store/use-insights'

export function InsightsPreview() {
  const search = filterSearch(useFilterStore((state) => state.filters))
  const insights = useInsights()

  return (
    <Card className="h-full" data-testid="insights-preview">
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>{insights.length ? `Top 3 of ${insights.length}` : 'Nothing unusual'}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to={{ pathname: '/insights', search }}>
              View all
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {insights.length ? (
          insights.slice(0, 3).map((insight) => <InsightCard key={insight.id} insight={insight} compact />)
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CircleCheck className="size-6" />
            No anomalies, gaps or pacing issues for these filters.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
