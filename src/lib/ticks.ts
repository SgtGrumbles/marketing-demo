/** Round axis ticks from zero up to max: steps of 1, 2, 2.5 or 5 × 10ⁿ, about `count` intervals. */
export function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = ([5, 2.5, 2, 1].find((m) => m * magnitude <= raw) ?? 1) * magnitude
  return Array.from({ length: Math.floor(max / step + 1e-9) + 1 }, (_, i) => i * step)
}
