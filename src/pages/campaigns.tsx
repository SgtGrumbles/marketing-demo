import { useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { CampaignTable } from '@/components/campaigns/campaign-table'
import { useSortedCampaigns } from '@/components/campaigns/use-sorted-campaigns'
import { ExportButton } from '@/components/export-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignStatus } from '@/data/types'
import { campaignRows } from '@/lib/campaigns'
import { toCsv } from '@/lib/csv'
import { CAMPAIGN_CSV, exportFilename } from '@/lib/exports'
import { useCampaignParam } from '@/store/use-campaign-param'
import { useFilteredData } from '@/store/use-filtered-data'

type StatusFilter = CampaignStatus | 'all'

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
]

// Channels are filtered by the global channel filter in the top bar.
export function CampaignsPage() {
  const { data, facts, filters, range } = useFilteredData()
  const { openCampaign } = useCampaignParam()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const needle = query.trim().toLowerCase()
  const visible = campaignRows(data, facts, filters.channels).filter(
    (row) => (status === 'all' || row.status === status) && row.name.toLowerCase().includes(needle),
  )
  const { sorted, sort, onSort } = useSortedCampaigns(visible)
  const clear = () => {
    setQuery('')
    setStatus('all')
  }

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaigns" aria-label="Search campaigns" className="pl-8" />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(STATUS_OPTIONS.find((o) => o.value === value)?.value ?? 'all')}>
            <SelectTrigger className="w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground" data-testid="campaign-count">
            {sorted.length} {sorted.length === 1 ? 'campaign' : 'campaigns'}
          </span>
          <div className="ml-auto">
            <ExportButton filename={exportFilename('campaigns', range)} build={() => toCsv(sorted, CAMPAIGN_CSV)} />
          </div>
        </div>

        {sorted.length > 0 ? (
          <CampaignTable rows={sorted} sort={sort} onSort={onSort} onOpen={openCampaign} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">No campaigns match these filters.</p>
            <Button variant="outline" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
