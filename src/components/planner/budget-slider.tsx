import type { CSSProperties } from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'

interface BudgetSliderProps {
  label: string
  value: number
  max: number
  step: number
  color: string
  onChange: (value: number) => void
}

/**
 * shadcn's Slider, styled the same, but with the accessible name on the thumb: the focusable part
 * that screen readers announce. The shadcn wrapper only forwards props to the root.
 */
export function BudgetSlider({ label, value, max, step, color, onChange }: BudgetSliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      min={0}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => next !== undefined && onChange(next)}
      className="relative flex w-full touch-none items-center select-none"
      style={{ '--channel': color } as CSSProperties}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-(--channel)" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={label}
        className="relative block size-4 shrink-0 rounded-full border border-(--channel) bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
      />
    </SliderPrimitive.Root>
  )
}
