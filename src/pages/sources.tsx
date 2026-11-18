import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { ConnectFlow } from '@/components/sources/connect-flow'
import { SourceCard } from '@/components/sources/source-card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getDataset } from '@/data/generate'
import { useNow } from '@/hooks/use-now'
import { SOURCES, sourceVolumes, type SourceKey } from '@/lib/sources'
import { summarizeSources, useSourcesStore } from '@/store/sources'

export function SourcesPage() {
  const volumes = sourceVolumes(getDataset())
  const { sources, syncNow, markConnected } = useSourcesStore()
  const now = useNow()
  const summary = summarizeSources(sources)
  // Each opening gets a fresh flow; the source stays set while the dialog animates closed.
  const [connecting, setConnecting] = useState<{ key: SourceKey; session: number } | null>(null)
  const [open, setOpen] = useState(false)
  const target = SOURCES.find((source) => source.key === connecting?.key)
  const targetVolume = target && volumes.get(target.key)

  const startConnect = (key: SourceKey) => {
    setConnecting((current) => ({ key, session: (current?.session ?? 0) + 1 }))
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium" data-testid="sources-summary">
          {summary.connected} of {summary.total} sources connected
        </span>
        <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
          <FlaskConical className="size-3" aria-hidden />
          Simulated connections: the demo data is already loaded
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SOURCES.map((source) => {
          const volume = volumes.get(source.key)
          if (!volume) return null
          return (
            <SourceCard
              key={source.key}
              source={source}
              state={sources[source.key]}
              volume={volume}
              now={now}
              onSync={() => syncNow(source.key)}
              onConnect={() => startConnect(source.key)}
            />
          )
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="connect-dialog">
          {target && targetVolume && connecting && (
            <ConnectFlow
              key={connecting.session}
              source={target}
              volume={targetVolume}
              onConnected={() => markConnected(target.key)}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
