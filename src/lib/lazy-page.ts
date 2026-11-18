import { lazy, type ComponentType } from 'react'

/** The first page waits at least this long, so the skeleton reads as loading rather than a flicker. */
const FIRST_LOAD_DELAY_MS = 400

let firstLoad = true
const loaders: (() => Promise<unknown>)[] = []

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A route component loaded in its own chunk. */
export function lazyPage<M>(load: () => Promise<M>, pick: (module: M) => ComponentType) {
  loaders.push(load)
  return lazy(async () => {
    const delay = firstLoad ? sleep(FIRST_LOAD_DELAY_MS) : null
    firstLoad = false
    const [module] = await Promise.all([load(), delay])
    preloadAll()
    return { default: pick(module) }
  })
}

let preloaded = false

/** Once the first page is up, fetch the other pages' chunks when idle, so later navigation is instant. */
function preloadAll() {
  if (preloaded) return
  preloaded = true
  const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 200))
  idle(() => {
    for (const load of loaders) void load()
  })
}
