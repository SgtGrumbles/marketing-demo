import { create } from 'zustand'
import { SOURCES, type SourceKey } from '@/lib/sources'

export interface SourceState {
  connected: boolean
  /** Epoch ms of the last sync, or null if never synced. */
  lastSynced: number | null
  syncing: boolean
}

interface SourcesStore {
  sources: Readonly<Record<SourceKey, SourceState>>
  syncNow: (key: SourceKey) => void
  markConnected: (key: SourceKey) => void
}

/** How long a simulated sync takes. */
export const SYNC_MS = 1_600

// Simulated: last-sync times are relative to page load, so the demo always reads "4 min ago".
const loadedAt = Date.now()
const initial = Object.fromEntries(
  SOURCES.map((source) => [
    source.key,
    { connected: source.connected, lastSynced: source.syncedMinutesAgo === undefined ? null : loadedAt - source.syncedMinutesAgo * 60_000, syncing: false },
  ]),
) as Record<SourceKey, SourceState>

export const useSourcesStore = create<SourcesStore>()((set, get) => {
  const update = (key: SourceKey, patch: Partial<SourceState>) =>
    set(({ sources }) => ({ sources: { ...sources, [key]: { ...sources[key], ...patch } } }))

  return {
    sources: initial,
    syncNow: (key) => {
      if (get().sources[key].syncing) return
      update(key, { syncing: true })
      window.setTimeout(() => update(key, { syncing: false, lastSynced: Date.now() }), SYNC_MS)
    },
    markConnected: (key) => update(key, { connected: true, lastSynced: Date.now() }),
  }
})

/** The header summary: how many sources are connected, the latest sync, and whether any is running. */
export function summarizeSources(sources: Readonly<Record<SourceKey, SourceState>>) {
  const states = Object.values(sources)
  const connected = states.filter((s) => s.connected)
  const synced = connected.map((s) => s.lastSynced).filter((t): t is number => t !== null)
  return {
    connected: connected.length,
    total: states.length,
    lastSynced: synced.length > 0 ? Math.max(...synced) : null,
    syncing: states.some((s) => s.syncing),
  }
}
