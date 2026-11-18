import { useSyncExternalStore } from 'react'

/** True while the media query matches. Use it instead of CSS hiding for anything that measures itself, like charts. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Tailwind's 2xl breakpoint: wide enough for the full campaign table. */
export const WIDE_SCREEN = '(min-width: 1536px)'
