import { Badge } from '@/components/ui/badge'
import type { CampaignStatus } from '@/data/types'
import { cn } from '@/lib/utils'

const STATUS = {
  active: { label: 'Active', dot: 'bg-success' },
  paused: { label: 'Paused', dot: 'bg-warning' },
  ended: { label: 'Ended', dot: 'bg-muted-foreground' },
} as const

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, dot } = STATUS[status]
  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </Badge>
  )
}
