import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { METRICS, type MetricKey } from '@/lib/metrics'
import { isTrendMetricAvailable, TREND_METRICS } from '@/lib/summaries'

interface MetricPickerProps {
  value: MetricKey
  onChange: (metric: MetricKey) => void
  /** Spend-based metrics are disabled when there's nothing spent. */
  hasSpend: boolean
}

export function MetricPicker({ value, onChange, hasSpend }: MetricPickerProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        const metric = TREND_METRICS.find((key) => key === next)
        if (metric) onChange(metric)
      }}
      aria-label="Metric"
    >
      {TREND_METRICS.map((key) => (
        <ToggleGroupItem key={key} value={key} disabled={!isTrendMetricAvailable(key, hasSpend)}>
          {METRICS[key].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
