import { Loader2, Plug, RefreshCw } from 'lucide-react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCount, formatTimeAgo, MISSING } from '@/lib/format'
import type { SourceDefinition, SourceVolume } from '@/lib/sources'
import { cn } from '@/lib/utils'
import type { SourceState } from '@/store/sources'

interface SourceCardProps {
  source: SourceDefinition
  state: SourceState
  volume: SourceVolume
  now: Date
  onSync: () => void
  onConnect: () => void
}

function SourceStatus({ state }: { state: SourceState }) {
  if (state.syncing)
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-foreground">
        <Loader2 className="size-3 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        Syncing
      </Badge>
    )
  if (state.connected)
    return (
      <Badge variant="outline" className="gap-1.5 border-success/40 bg-success/10 text-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-success" />
        Connected
      </Badge>
    )
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full border border-muted-foreground" />
      Not connected
    </Badge>
  )
}

export function SourceCard({ source, state, volume, now, onSync, onConnect }: SourceCardProps) {
  const Icon = source.icon
  const channels = source.channels === 'all' ? [] : source.channels
  const stats = [
    { label: 'Last sync', value: state.lastSynced === null ? MISSING : formatTimeAgo(new Date(state.lastSynced), now), testId: 'last-sync' },
    { label: 'Rows', value: state.connected ? formatCount(volume.rows) : MISSING, testId: 'rows' },
    { label: 'History', value: state.connected ? `${formatCount(volume.days)} days` : MISSING, testId: 'history' },
  ]

  return (
    <Card data-source={source.key} data-status={state.syncing ? 'syncing' : state.connected ? 'connected' : 'disconnected'} className={cn('transition-colors duration-300', !state.connected && 'border-dashed')}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="grid gap-1">
            <CardTitle>{source.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              {channels.map((channel) => <ChannelSwatch key={channel} channel={channel} />)}
              {source.feeds}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <SourceStatus state={state} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-muted-foreground">{stat.label}</dt>
              <dd className="font-medium tabular-nums" data-testid={stat.testId}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter className="mt-auto">
        {state.connected ? (
          <Button variant="outline" size="sm" onClick={onSync} disabled={state.syncing}>
            <RefreshCw className={cn(state.syncing && 'animate-spin motion-reduce:animate-none')} aria-hidden />
            {state.syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect}>
            <Plug aria-hidden />
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
