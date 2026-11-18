import { create } from 'zustand'
import { getDataset } from '@/data/generate'
import { mapChannels, plannerBaseline, rebalance, type Allocation, type PlannerChannel } from '@/lib/planner'

interface PlannerStore {
  allocation: Allocation
  lockTotal: boolean
  /** True while Optimize is sliding the budgets to their new values. */
  animating: boolean
  setBudget: (channel: PlannerChannel, value: number) => void
  setLockTotal: (lockTotal: boolean) => void
  animateTo: (target: Allocation) => void
  reset: () => void
}

const ANIMATION_MS = 700

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let frame: number | undefined

const stopAnimation = () => {
  if (frame !== undefined) cancelAnimationFrame(frame)
  frame = undefined
}

// Kept in a store rather than the page so a plan survives navigating away and back.
export const usePlannerStore = create<PlannerStore>()((set, get) => ({
  allocation: plannerBaseline(getDataset()).allocation,
  lockTotal: true,
  animating: false,
  setBudget: (channel, value) => {
    stopAnimation()
    const { allocation, lockTotal } = get()
    set({ allocation: rebalance(plannerBaseline(getDataset()), allocation, channel, value, lockTotal), animating: false })
  },
  setLockTotal: (lockTotal) => set({ lockTotal }),
  animateTo: (target) => {
    stopAnimation()
    if (prefersReducedMotion()) return set({ allocation: target, animating: false })
    const from = get().allocation
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS)
      const eased = easeInOut(t)
      set({ allocation: mapChannels((channel) => from[channel] + (target[channel] - from[channel]) * eased), animating: t < 1 })
      frame = t < 1 ? requestAnimationFrame(tick) : undefined
    }
    set({ animating: true })
    frame = requestAnimationFrame(tick)
  },
  reset: () => get().animateTo(plannerBaseline(getDataset()).allocation),
}))
