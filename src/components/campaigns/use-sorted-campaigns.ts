import { useState } from 'react'
import type { CampaignRow } from '@/lib/campaigns'
import { nextSort, sortRows, type SortState } from '@/lib/sort'

export type CampaignColumn = 'name' | 'channel' | 'status' | 'spend' | 'revenue' | 'roas' | 'cpa' | 'pacing'

const STATUS_ORDER = { active: 0, paused: 1, ended: 2 } as const

const sortValue = (row: CampaignRow, key: CampaignColumn) => {
  switch (key) {
    case 'status':
      return STATUS_ORDER[row.status]
    case 'pacing':
      return row.pacing?.pacing
    default:
      return row[key]
  }
}

/** The rows in the table's current order, for CSV export. */
export function useSortedCampaigns(rows: readonly CampaignRow[]) {
  const [sort, setSort] = useState<SortState<CampaignColumn>>({ key: 'spend', direction: 'desc' })
  const onSort = (column: CampaignColumn) => setSort((current) => nextSort(current, column, column === 'name' || column === 'channel'))
  return { sorted: sortRows(rows, sort, sortValue), sort, onSort }
}
