# Data spec

## The fictional company
**Fernleaf Supply Co.** is an online brand selling outdoor and home goods (camping gear, blankets, drinkware). Average order is about $85, and annual marketing spend is about $4M. All names are fictional.

To swap the company, edit only data/config.ts.

## Generation approach
- Generated in the browser at startup by src/data/generate.ts, memoized.
- Seeded PRNG (mulberry32; seed lives in config). The same seed gives the same numbers on every load.
- 18 months of daily data ending yesterday, relative to today's date, so the dashboard always looks current.
- Storylines are anchored to "N days before today" so they always fall in the recent window. Holidays (Black Friday, Cyber Monday) sit on their real calendar dates.
- Target size: about 25 campaigns × 540 days ≈ 13–14k rows. Generation must take under 200 ms.

## Channels

| Channel | Key | Cost model | Behavior |
|---|---|---|---|
| Paid Search (Google Ads) | `search` | CPC spend | Steady, high intent, best CVR. Heavier on weekdays. |
| Paid Social (Meta) | `meta` | CPM spend | Largest spend. Heavier on weekends. Carries the creative-fatigue story. |
| TikTok | `tiktok` | CPM spend | Launched about 120 days ago and still ramping. |
| Email (Klaviyo) | `email` | Small fixed platform cost | Spikes on send days (Tue/Thu) and promos. Impressions = emails delivered. |
| Organic Search | `organic` | None | Slow upward trend. |
| Affiliate | `affiliate` | Commission = 10% of revenue | Small and steady. |

Campaign naming convention: `{channel}_{objective}_{audience}_{yyyymm}`, e.g. `meta_conv_lookalike_202608`. Each paid channel has 3–6 campaigns; some are paused or ended.

## Data model

```ts
type ChannelKey = 'search' | 'meta' | 'tiktok' | 'email' | 'organic' | 'affiliate';

interface Campaign {
  id: string;
  name: string;
  channel: ChannelKey;
  objective: 'awareness' | 'traffic' | 'conversion' | 'retention';
  status: 'active' | 'paused' | 'ended';
  startDate: string;          // YYYY-MM-DD
  endDate?: string;
  monthlyBudget?: number;
}

// Grain: date × campaign
interface DailyFact {
  date: string;
  campaignId: string;
  channel: ChannelKey;
  impressions: number;
  clicks: number;
  spend: number;
  sessions: number;
  addToCarts: number;
  orders: number;
  revenue: number;
  newCustomers: number;
}

// Only for meta and tiktok
interface Creative {
  id: string;
  campaignId: string;
  name: string;
  format: 'image' | 'video' | 'carousel';
}

interface CreativeDaily {
  date: string;
  creativeId: string;
  impressions: number;
  clicks: number;
  spend: number;
  orders: number;
  revenue: number;
  frequency: number;
}
```

## Metric definitions (implement in lib/metrics.ts)

| Metric | Formula | Display | Good direction |
|---|---|---|---|
| CTR | clicks / impressions | 3.4% | up |
| CPC | spend / clicks | $1.23 | down |
| CPM | spend / impressions × 1000 | $8.40 | down |
| CVR | orders / sessions | 2.1% | up |
| CPA | spend / orders | $24.10 | down |
| ROAS | revenue / spend | 3.2x | up |
| AOV | revenue / orders | $85.40 | up |
| CAC | spend / newCustomers | $41.00 | down |
| MER | total revenue / total spend (all channels) | 3.8x | up |
| Spend | sum | $1.2M | neutral |

Always compute ratios from sums. A zero denominator displays as "—".

## Realism rules
- The funnel is monotonic: impressions ≥ clicks ≥ sessions ≥ addToCarts ≥ orders. Paid sessions are about 85–95% of clicks.
- Counts are integers; currency is rounded to cents.
- Weekly seasonality per channel, as in the table above.
- Annual seasonality: Q4 ramp peaking at Black Friday/Cyber Monday (spend ×2.5, revenue ×3), a January dip, a small spring bump.
- Growth trend of about +25% year-over-year revenue.
- Multiplicative daily noise of ±8–15%, lower for search.
- Paused or ended campaigns have no rows after they stop.
- Target ranges: search ROAS 4–6x; meta 2–3.5x; tiktok rising from 1.2x to 3.8x over its ramp; affiliate about 10x by construction; blended MER 3.5–4x.

## Planted storylines
Each one should be visible in the UI and caught by the insights engine (lib/insights.ts).

1. **Meta creative fatigue.** In the top Meta campaign, the creative "Summer Trail – Video 03" shows, over the last 21 days, frequency rising from 1.8 to 4.5, CTR falling about 40%, and CPA rising about 35%.
2. **TikTok is quietly winning.** Over the last 30 days TikTok has the best ROAS among paid social channels despite the smallest spend, and the most headroom in the budget planner.
3. **Tracking outage.** Nine days ago, Paid Search orders and revenue drop about 90% for one day while clicks and spend stay normal. The insight should call it a likely tracking issue, not a performance drop.
4. **Email promo spike.** Four days ago a promo send drives email revenue to 3–4× its normal level.
5. **Holiday ramp.** Spend ramps toward Black Friday/Cyber Monday on the real calendar.
6. **Over-budget campaign.** One search campaign is pacing at 115% of its monthly budget.

## Budget planner response curves
For each channel, monthly revenue = `a × (1 − e^(−spend / b))`.

Hand-set `a` and `b` so that current spend sits on the diminishing-returns shoulder and the curve reproduces the last 30 days of generated revenue. TikTok has the most headroom (large `b`); Meta is closest to saturation. Organic has no curve; email and affiliate stay fixed in the planner.

## Simulated data sources

| Source | Feeds |
|---|---|
| Google Ads | search |
| Meta Ads | meta |
| TikTok Ads | tiktok |
| Klaviyo | email |
| Google Analytics 4 | sessions, organic |
| Shopify | orders, revenue, newCustomers |
| Affiliate network | affiliate |

Use generic icons or lettermarks, not official logos.
