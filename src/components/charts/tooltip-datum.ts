/** Recharts hands tooltip content the hovered datum as `payload[0].payload`. */
export function tooltipDatum<T>(payload: ReadonlyArray<{ payload?: unknown }> | undefined): T | undefined {
  return payload?.[0]?.payload as T | undefined
}
