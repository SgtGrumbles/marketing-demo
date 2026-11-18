export const CHANNEL_KEYS = ['search', 'meta', 'tiktok', 'email', 'organic', 'affiliate'] as const

export type ChannelKey = (typeof CHANNEL_KEYS)[number]

export type Objective = 'awareness' | 'traffic' | 'conversion' | 'retention'

export type CampaignStatus = 'active' | 'paused' | 'ended'

export interface Campaign {
  id: string
  name: string
  channel: ChannelKey
  objective: Objective
  status: CampaignStatus
  startDate: string // YYYY-MM-DD
  endDate?: string
  monthlyBudget?: number
}

// Grain: date × campaign
export interface DailyFact {
  date: string
  campaignId: string
  channel: ChannelKey
  impressions: number
  clicks: number
  spend: number
  sessions: number
  addToCarts: number
  orders: number
  revenue: number
  newCustomers: number
}

export type CreativeFormat = 'image' | 'video' | 'carousel'

// Only for meta and tiktok
export interface Creative {
  id: string
  campaignId: string
  name: string
  format: CreativeFormat
}

// Creative rows for a campaign-day sum to that campaign's DailyFact.
export interface CreativeDaily {
  date: string
  creativeId: string
  impressions: number
  clicks: number
  spend: number
  orders: number
  revenue: number
  frequency: number
}

export interface Dataset {
  /** The dashboard's "today". */
  asOfDate: string
  /** First and last dates with data (the last is the day before asOfDate). */
  startDate: string
  endDate: string
  campaigns: readonly Campaign[]
  facts: readonly DailyFact[]
  creatives: readonly Creative[]
  creativeFacts: readonly CreativeDaily[]
}
