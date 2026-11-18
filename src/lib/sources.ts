import { BarChart3, Handshake, Mail, Megaphone, Search, ShoppingBag, Video, type LucideIcon } from 'lucide-react'
import { COMPANY } from '@/data/config'
import type { ChannelKey, Dataset } from '@/data/types'
import { memoByDataset } from '@/lib/memo'

// Simulated data sources (docs/DATA.md). The data already exists; connecting and syncing only change
// what this page shows. Names are text only, with generic icons, never platform logos or colors.

export type SourceKey = 'google-ads' | 'meta-ads' | 'tiktok-ads' | 'klaviyo' | 'ga4' | 'shopify' | 'affiliate'

export interface SourceDefinition {
  key: SourceKey
  name: string
  icon: LucideIcon
  /** What it feeds, in words. */
  feeds: string
  /** Channels whose rows come from it; all channels for site-wide sources. */
  channels: readonly ChannelKey[] | 'all'
  /** Connected when the page loads. */
  connected: boolean
  /** For connected sources: minutes before page load of the last sync. */
  syncedMinutesAgo?: number
  /** What the simulated consent screen asks for. */
  permissions: readonly string[]
}

const READ_ADS = ['Read campaigns, ad sets and creatives', 'Read spend, impressions and clicks', 'Read conversion events']

export const SOURCES: readonly SourceDefinition[] = [
  { key: 'google-ads', name: 'Google Ads', icon: Search, feeds: 'Paid Search', channels: ['search'], connected: true, syncedMinutesAgo: 4, permissions: READ_ADS },
  { key: 'meta-ads', name: 'Meta Ads', icon: Megaphone, feeds: 'Meta', channels: ['meta'], connected: true, syncedMinutesAgo: 6, permissions: READ_ADS },
  { key: 'tiktok-ads', name: 'TikTok Ads', icon: Video, feeds: 'TikTok', channels: ['tiktok'], connected: true, syncedMinutesAgo: 9, permissions: READ_ADS },
  {
    key: 'klaviyo', name: 'Klaviyo', icon: Mail, feeds: 'Email', channels: ['email'], connected: false,
    permissions: ['Read campaigns and flows', 'Read sends, opens and clicks', 'Read attributed orders'],
  },
  {
    key: 'ga4', name: 'Google Analytics 4', icon: BarChart3, feeds: 'Sessions and Organic Search', channels: 'all', connected: true, syncedMinutesAgo: 5,
    permissions: ['Read sessions and traffic sources', 'Read landing pages', 'Read e-commerce events'],
  },
  {
    key: 'shopify', name: 'Shopify', icon: ShoppingBag, feeds: 'Orders, revenue and new customers', channels: 'all', connected: true, syncedMinutesAgo: 4,
    permissions: ['Read orders and refunds', 'Read customers (no payment details)', 'Read products'],
  },
  {
    key: 'affiliate', name: 'Affiliate network', icon: Handshake, feeds: 'Affiliate', channels: ['affiliate'], connected: false,
    permissions: ['Read partners and creators', 'Read clicks and commissions', 'Read attributed orders'],
  },
]

/** The accounts offered on the simulated consent screen. */
export function sourceAccounts(source: SourceDefinition): { id: string; name: string; detail: string }[] {
  const digits = (offset: number) => String(4_810_000_000 + offset * 7_919 + source.key.length * 104_729).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  return [
    { id: 'main', name: COMPANY.name, detail: `Main account · ${digits(1)}` },
    { id: 'sandbox', name: `${COMPANY.name} (sandbox)`, detail: `Test account · ${digits(2)}` },
  ]
}

export interface SourceVolume {
  rows: number
  days: number
}

/** Daily rows each source contributes to the dataset, and how many days of history. */
export const sourceVolumes = memoByDataset((data: Dataset): ReadonlyMap<SourceKey, SourceVolume> => {
  const days = new Set(data.facts.map((fact) => fact.date)).size
  return new Map(
    SOURCES.map((source) => {
      const { channels } = source
      const rows = channels === 'all' ? data.facts.length : data.facts.filter((fact) => channels.includes(fact.channel)).length
      return [source.key, { rows, days }]
    }),
  )
})
