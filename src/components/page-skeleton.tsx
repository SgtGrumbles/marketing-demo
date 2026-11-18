import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** Stand-in while a page loads: a KPI row, a chart and a table, matching the common page shape. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="gap-3 px-4 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
      <Card className="gap-4 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="gap-3 p-6">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </Card>
    </div>
  )
}
