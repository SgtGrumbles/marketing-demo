# Product brief

## One-liner
Pulse is a cross-channel marketing dashboard that shows where the money goes, what it returns, and what to do next. It was built as a proof of concept with Claude Code.

## Audience
**Presentation audience:** marketers across brand, performance, lifecycle and leadership roles, with mixed technical depth. Assume they live in GA4, Meta Ads Manager, Google Ads and spreadsheets today.

**In-app persona:** a marketing manager at Fernleaf Supply Co. who checks performance every morning and reallocates budget weekly.

## What the presentation needs to prove
1. A dashboard that looks like a paid SaaS product can be built quickly with generative code.
2. It answers questions marketers ask every week.
3. It's easy to extend: a new metric, chart or data source is a prompt away.

Idea for point 3: live-build one small feature on stage (e.g. a new KPI tile or chart) from a prompt rehearsed beforehand.

## Features

### Must have
- Global date range (last 7/30/90 days, QTD, YTD, custom) with comparison to the previous period
- Global channel filter
- Overview page: KPI tiles with deltas and sparklines, spend vs. revenue trend, channel breakdown
- Channel and campaign drill-downs with sortable tables
- Funnel view
- Insights panel with auto-generated observations
- Light and dark mode

### Should have
- Budget planner (what-if sliders with projected results)
- Data Sources page with a simulated "connect" flow
- CSV export from any table

### Could have
- Campaign detail drawer with creative-level stats
- Goals and targets with pacing bars
- ⌘K command palette for navigation
- Shareable URLs (filters in the query string)

## Real vs. simulated

| Feature | Status |
|---|---|
| Charts, tables, filters, drill-downs | Real: computed live from the data |
| The data itself | Generated in the browser from a fixed seed |
| Insights | Real rule-based detection over the data, written up with templates. Reads like AI; no LLM call. |
| Budget planner projections | Real math over hand-set response curves, not a fitted model |
| Data source connections | Simulated: button → fake OAuth modal → progress bar → "Connected" |
| "Last synced 4 min ago" | Simulated, relative to page load |

## Non-goals
- Authentication, users, permissions
- Real API connectors or a backend
- Persistence beyond localStorage for UI preferences
- Mobile-first layout (desktop and projector first; it shouldn't break on a tablet)

## Success criteria
- Loads in under 2 seconds from a static build, fully offline
- No console errors or warnings
- Looks right at 1920×1080 and at 1280×720 (projector fallback)
- Every control on screen does something
- Totals reconcile across pages for the same filters
