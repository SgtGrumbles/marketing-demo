import { useState } from 'react'
import type { CreativeRow } from '@/lib/creatives'
import { nextSort, sortRows, type SortState } from '@/lib/sort'

export type CreativeColumn = 'name' | 'impressions' | 'ctr' | 'ctrChange' | 'frequency' | 'cpa' | 'fatigue'

const sortValue = (row: CreativeRow, key: CreativeColumn) => {
  switch (key) {
    case 'ctrChange':
      return row.signal?.ctrChange
    case 'fatigue':
      return row.signal?.fatigued ? 1 : 0
    default:
      return row[key]
  }
}

/** The rows in the table's current order, for CSV export. Fatigued creatives float to the top by default. */
export function useSortedCreatives(rows: readonly CreativeRow[]) {
  const [sort, setSort] = useState<SortState<CreativeColumn>>({ key: 'fatigue', direction: 'desc' })
  const onSort = (column: CreativeColumn) => setSort((current) => nextSort(current, column, column === 'name'))
  return { sorted: sortRows(rows, sort, sortValue), sort, onSort }
}
