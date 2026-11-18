import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { formatCurrency, parseCurrencyInput } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BudgetInputProps {
  value: number
  onCommit: (value: number) => void
  label: string
  className?: string
}

/** A dollar amount that shows formatted, edits as plain text and commits on Enter or blur. */
export function BudgetInput({ value, onCommit, label, className }: BudgetInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && parseCurrencyInput(draft) === null

  const commit = () => {
    const parsed = draft === null ? null : parseCurrencyInput(draft)
    if (parsed !== null) onCommit(parsed)
    setDraft(null)
  }

  return (
    <Input
      inputMode="decimal"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn('text-right tabular-nums', className)}
      value={draft ?? formatCurrency(value)}
      onFocus={(event) => {
        setDraft(String(Math.round(value)))
        const input = event.target
        requestAnimationFrame(() => input.select())
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        const input = event.currentTarget
        if (event.key === 'Enter') input.blur()
        if (event.key === 'Escape') {
          // Discard the draft first, so the blur that follows has nothing to commit.
          setDraft(null)
          requestAnimationFrame(() => input.blur())
        }
      }}
    />
  )
}
