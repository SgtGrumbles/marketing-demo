import type { ChannelKey, Dataset } from '@/data/types'
import { memoByDataset } from '@/lib/memo'

export interface Coverage {
  from: string
  to: string
}

/** First and last day each channel has any data. */
const channelCoverage = memoByDataset((data: Dataset): ReadonlyMap<ChannelKey, Coverage> => {
  const result = new Map<ChannelKey, Coverage>()
  for (const { channel, date } of data.facts) {
    const span = result.get(channel)
    if (!span) result.set(channel, { from: date, to: date })
    else {
      if (date < span.from) span.from = date
      if (date > span.to) span.to = date
    }
  }
  return result
})

/** The span with data for any of the channels, or null if none ever ran. */
export function coverage(data: Dataset, channels: readonly ChannelKey[]): Coverage | null {
  const spans = channels.map((channel) => channelCoverage(data).get(channel)).filter((span): span is Coverage => span !== undefined)
  if (spans.length === 0) return null
  return {
    from: spans.reduce((min, span) => (span.from < min ? span.from : min), spans[0]?.from ?? ''),
    to: spans.reduce((max, span) => (span.to > max ? span.to : max), spans[0]?.to ?? ''),
  }
}
