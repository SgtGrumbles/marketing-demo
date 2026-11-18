import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { TableHead } from '@/components/ui/table'
import type { SortState } from '@/lib/sort'
import { cn } from '@/lib/utils'

interface SortableHeadProps<K extends string> {
  column: K
  sort: SortState<K>
  onSort: (column: K) => void
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
}

export function SortableHead<K extends string>({ column, sort, onSort, align = 'right', className, children }: SortableHeadProps<K>) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right', className)}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {children}
        <Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden />
      </button>
    </TableHead>
  )
}
