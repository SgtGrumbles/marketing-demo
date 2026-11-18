import { CHANNEL_KEYS, type ChannelKey } from '@/data/types'

export interface ChannelMeta {
  key: ChannelKey
  label: string
  /** The simulated data source that feeds it. Shown as text only, never with a logo. */
  platform: string
  /** Two letters used instead of platform logos. */
  lettermark: string
  /** The one color for this channel in every chart, badge and legend. */
  color: string
  /** Bought media with a budget the planner can move. */
  paid: boolean
  group: 'search' | 'social' | 'owned' | 'earned' | 'partner'
}

/*
 * Colors map to --chart-1 … --chart-6 in channel order. The slots form a categorical palette
 * validated for color-blind separation between neighbors, so keep this order. Light mode has
 * three slots under 3:1 contrast, so charts must always carry a legend or labels.
 */
export const CHANNELS: Readonly<Record<ChannelKey, ChannelMeta>> = {
  search: { key: 'search', label: 'Paid Search', platform: 'Google Ads', lettermark: 'PS', color: 'var(--chart-1)', paid: true, group: 'search' },
  meta: { key: 'meta', label: 'Meta', platform: 'Meta Ads', lettermark: 'ME', color: 'var(--chart-2)', paid: true, group: 'social' },
  tiktok: { key: 'tiktok', label: 'TikTok', platform: 'TikTok Ads', lettermark: 'TT', color: 'var(--chart-3)', paid: true, group: 'social' },
  email: { key: 'email', label: 'Email', platform: 'Klaviyo', lettermark: 'EM', color: 'var(--chart-4)', paid: false, group: 'owned' },
  organic: { key: 'organic', label: 'Organic Search', platform: 'Google Analytics 4', lettermark: 'OS', color: 'var(--chart-5)', paid: false, group: 'earned' },
  affiliate: { key: 'affiliate', label: 'Affiliate', platform: 'Affiliate network', lettermark: 'AF', color: 'var(--chart-6)', paid: false, group: 'partner' },
}

export const CHANNEL_LIST: readonly ChannelMeta[] = CHANNEL_KEYS.map((key) => CHANNELS[key])

export const PAID_CHANNELS: readonly ChannelKey[] = CHANNEL_KEYS.filter((key) => CHANNELS[key].paid)

/** Meta and TikTok: the peer group for the efficiency-leader insight. */
export const PAID_SOCIAL_CHANNELS: readonly ChannelKey[] = CHANNEL_KEYS.filter((key) => CHANNELS[key].group === 'social')

export function channelColor(key: ChannelKey): string {
  return CHANNELS[key].color
}

export function channelLabel(key: ChannelKey): string {
  return CHANNELS[key].label
}
