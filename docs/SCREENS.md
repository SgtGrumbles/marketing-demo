# Screens

## App shell
- **Left sidebar** (collapsible): Pulse wordmark with a generic icon, then nav to Overview, Channels, Campaigns, Funnel, Budget Planner, Insights and Data Sources.
- **Top bar**: page title, date range picker, "Compare to previous period" toggle, channel multi-select, light/dark toggle, and "Last synced 4 min ago" with a green dot.
- Filters are global (Zustand) and mirrored in the URL query string.
- First render shows skeletons; a fake 300–500 ms delay is fine for polish.

## 1. Overview — `/`
- **KPI row** (6 tiles): Spend, Revenue, ROAS, Orders, CPA, New Customers. Each tile has the value, a delta vs. the previous period (arrow + %, colored by good/bad direction) and a sparkline.
- **Main chart**: Spend vs. Revenue over time with a daily/weekly toggle. When compare is on, the previous period shows as dashed lines.
- **Channel table**: channel, spend, revenue, ROAS, CPA, CVR, share-of-spend bar. Clicking a row opens the Channels page for that channel.
- **Spend mix**: horizontal bars by channel.
- **Insights preview**: the top 3 insight cards and a "View all" link.

## 2. Channels — `/channels/:channel?`
- Channel tabs.
- KPI row for the selected channel.
- Trend chart with a metric picker (spend, revenue, ROAS, CTR, CPA, CVR).
- Campaigns table for the channel.
- For Meta and TikTok, a Creatives table: placeholder thumbnail, impressions, CTR, frequency, CPA, and a "Fatigue" badge when the rule fires.

## 3. Campaigns — `/campaigns`
- A table of every campaign: name, channel badge, status, spend, revenue, ROAS, CPA, budget pacing bar, 30-day sparkline.
- Search box, status and channel filters, sortable columns, CSV export.
- Clicking a row opens a side drawer with the campaign's KPIs, trend chart, creatives (if any) and budget pacing.

## 4. Funnel — `/funnel`
- A funnel from Impressions → Clicks → Sessions → Add to cart → Orders, showing stage counts and step conversion rates.
- A by-channel comparison (grouped bars or small multiples) showing where each channel leaks.
- A callout naming the biggest drop-off.

## 5. Budget Planner — `/planner`
- Monthly budget per channel, each with a slider and a number input. A "Lock total" toggle makes one slider's change rebalance the others.
- Projected revenue, ROAS and orders per channel and in total, compared with current.
- A response-curve chart per channel with "current" and "proposed" markers.
- An "Optimize" button that allocates a fixed total by greedy marginal return and animates the sliders to the result.
- A small chip reading "Projections from modeled response curves".

## 6. Insights — `/insights`
- A list of insight cards. Each has a severity (info, opportunity, warning), a title, a one-sentence explanation with real numbers, a mini chart, and a "View" link that opens the relevant page with filters applied.
- A filter by insight type.
- Rules in lib/insights.ts:
  - **Anomaly**: daily metric z-score vs. the trailing 28 days
  - **Trend**: slope over 21 days
  - **Creative fatigue**: frequency rising while CTR falls
  - **Tracking gap**: clicks normal, orders near zero
  - **Pacing**: campaign above 110% of budget
  - **Efficiency leader**: best ROAS channel over the last 30 days
- All six storylines in DATA.md must be detected.

## 7. Data Sources — `/sources`
- A grid of source cards: generic icon, name, what it feeds, status, last sync, row count.
- Five are connected and two are not.
- **Connect** opens a modal that mimics OAuth (pick an account, review a permissions checklist), then a progress bar ("Fetching 18 months of history…"), then the card flips to Connected. It's purely visual; the data already exists.
- **Sync now** shows a spinner, then updates the last-synced time.

## Cross-cutting
- Empty states when filters return nothing.
- Formatted tooltips on every chart.
- Every table is sortable and exportable to CSV.
- ⌘K command palette (could-have).
