import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { parseFilters, sameFilters, writeFilters } from '@/lib/filter-params'
import { useFilterStore } from './filters'

/**
 * Two-way sync between the filter store and the query string. Mount once, in the app layout.
 * Each direction is a no-op when the two already agree, so they can't loop.
 */
export function useFilterUrlSync(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useFilterStore((state) => state.filters)

  // URL → store: links, back/forward, and edits to the address bar.
  useEffect(() => {
    const fromUrl = parseFilters(searchParams)
    const { filters: current, replaceFilters } = useFilterStore.getState()
    if (!sameFilters(fromUrl, current)) replaceFilters(fromUrl)
  }, [searchParams])

  // Store → URL: filter controls. Reads the store directly so a back/forward that just updated it
  // isn't overwritten with the stale render value. Replace rather than push to keep history clean.
  useEffect(() => {
    const next = writeFilters(useFilterStore.getState().filters, searchParams)
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
  }, [filters, searchParams, setSearchParams])
}
