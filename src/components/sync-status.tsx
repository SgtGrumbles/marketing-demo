import { Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useNow } from '@/hooks/use-now'
import { formatTimeAgo } from '@/lib/format'
import { summarizeSources, useSourcesStore } from '@/store/sources'

export function SyncStatus() {
  const now = useNow()
  const { connected, total, lastSynced, syncing } = summarizeSources(useSourcesStore((state) => state.sources))
  const label = syncing ? 'Syncing…' : lastSynced === null ? 'Not synced yet' : `Last synced ${formatTimeAgo(new Date(lastSynced), now)}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground" data-testid="sync-status">
          {syncing ? (
            <Loader2 className="size-3.5 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
          ) : (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
          )}
          <span className="hidden 2xl:inline">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {label} · {connected} of {total} sources connected
      </TooltipContent>
    </Tooltip>
  )
}
