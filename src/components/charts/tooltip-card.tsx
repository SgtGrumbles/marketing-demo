import type { ReactNode } from 'react'

export interface TooltipRow {
  label: string
  value: string
  color: string
  dashed?: boolean
}

/** The one tooltip look for every chart: a title, then value-first rows keyed by a short line in the series color. */
export function TooltipCard({ title, rows, note }: { title: ReactNode; rows: readonly TooltipRow[]; note?: ReactNode }) {
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <div className="mb-1.5 font-medium">{title}</div>
      <div className="grid gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="w-3 shrink-0 border-t-2"
              style={{ borderColor: row.color, borderStyle: row.dashed ? 'dashed' : 'solid', opacity: row.dashed ? 0.7 : 1 }}
            />
            <span className="font-semibold tabular-nums">{row.value}</span>
            <span className="text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </div>
      {note && <div className="mt-1.5 text-muted-foreground">{note}</div>}
    </div>
  )
}

/** A legend entry: a line key in the series color and its name. */
export function LegendItem({ label, color, dashed = false }: { label: string; color: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span aria-hidden className="w-4 border-t-2" style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid', opacity: dashed ? 0.7 : 1 }} />
      {label}
    </span>
  )
}
