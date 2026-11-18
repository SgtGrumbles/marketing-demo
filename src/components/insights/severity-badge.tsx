import { Info, TrendingUp, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Severity } from '@/lib/insights'
import { cn } from '@/lib/utils'

const SEVERITY = {
  warning: { label: 'Warning', icon: TriangleAlert, className: 'border-warning/50 bg-warning/10', iconClass: 'text-warning' },
  opportunity: { label: 'Opportunity', icon: TrendingUp, className: 'border-success/40 bg-success/10', iconClass: 'text-success' },
  info: { label: 'Info', icon: Info, className: 'border-primary/30 bg-primary/5', iconClass: 'text-primary' },
} as const

/** Severity is always icon + label, never color alone. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, icon: Icon, className, iconClass } = SEVERITY[severity]
  return (
    <Badge variant="outline" className={cn('gap-1 text-foreground', className)}>
      <Icon className={cn('size-3', iconClass)} aria-hidden />
      {label}
    </Badge>
  )
}
