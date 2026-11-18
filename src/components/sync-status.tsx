import { useEffect, useState } from 'react'
import { formatTimeAgo } from '@/lib/format'

// Simulated: the "last sync" happened four minutes before the page loaded.
const LAST_SYNCED = new Date(Date.now() - 4 * 60_000)

export function SyncStatus() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span>Last synced {formatTimeAgo(LAST_SYNCED, now)}</span>
    </div>
  )
}
