import type { KeyboardEvent } from 'react'

/**
 * Props that make a table row act like a link: focusable, opened by click, Enter or Space, with a
 * visible focus ring. The row's first cell names where it goes, so screen readers hear the name.
 */
export function rowAction(open: () => void) {
  return {
    tabIndex: 0,
    className: 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
    onClick: open,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        open()
      }
    },
  }
}
