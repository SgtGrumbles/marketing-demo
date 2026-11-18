import { create } from 'zustand'
import type { ChannelKey } from '@/data/types'
import type { QuickPreset } from '@/lib/date-range'
import { DEFAULT_FILTERS, normalizeChannels, parseFilters, type Filters } from '@/lib/filter-params'

interface FilterStore {
  filters: Filters
  setPreset: (range: QuickPreset) => void
  setCustomRange: (from: string, to: string) => void
  setCompare: (compare: boolean) => void
  setChannels: (channels: readonly ChannelKey[]) => void
  replaceFilters: (filters: Filters) => void
}

// Read the URL synchronously so the first render already matches a shared link.
const initialFilters = typeof window === 'undefined' ? DEFAULT_FILTERS : parseFilters(new URLSearchParams(window.location.search))

export const useFilterStore = create<FilterStore>()((set) => ({
  filters: initialFilters,
  setPreset: (range) => set(({ filters }) => ({ filters: { compare: filters.compare, channels: filters.channels, range } })),
  setCustomRange: (from, to) => set(({ filters }) => ({ filters: { ...filters, range: 'custom', from, to } })),
  setCompare: (compare) => set(({ filters }) => ({ filters: { ...filters, compare } })),
  setChannels: (channels) => set(({ filters }) => ({ filters: { ...filters, channels: normalizeChannels(channels) } })),
  replaceFilters: (filters) => set({ filters }),
}))
