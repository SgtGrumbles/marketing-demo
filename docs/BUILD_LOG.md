# Build log

Evidence for the presentation: how long this took, how much was generated, and what needed fixing.

## Summary (fill in at the end)

| Stat | Value |
|---|---|
| Total build time | |
| Claude Code sessions | |
| Prompts sent | |
| Lines of code in src/ (`npx cloc src`) | |
| Lines written by hand | |
| Milestones completed | / 11 |

## How to log
After each milestone, Claude Code appends an entry using the template below, with timestamps taken from `date`. Ace adds the prompts used and anything Claude didn't see (e.g. time spent reviewing). Save a screenshot per milestone in screenshots/.

## Template

### M<n> — <title>
- **Start / end:**
- **Prompt(s):**
- **What was built:**
- **Files changed:**
- **Iterations / corrections:**
- **What went wrong and how it was fixed:**
- **Screenshot:** screenshots/m<n>.png

---

## Entries

### M0 — Scaffold
- **Start / end:** 2026-11-17 21:35 – 21:41 MST (about 6 min, after a read-and-plan pass over the docs)
- **Prompt(s):** "Read CLAUDE.md and everything in docs/. Don't write code yet. Summarize the plan back to me, list anything ambiguous, then propose how you'll do M0." Then answers to the open questions and a go-ahead.
- **What was built:** Vite 8 + React 19 + TypeScript 7 (strict, plus `noUncheckedIndexedAccess`); Tailwind v4 and shadcn/ui (radix base) on a zinc palette with a blue-teal accent and six chart tokens (`--chart-1` … `--chart-6`); Inter bundled locally via `@fontsource-variable/inter`; React Router with all seven routes from SCREENS.md (including `/channels/:channel?`) plus a catch-all redirect to Overview; collapsible icon sidebar driven by a single `NAV_ITEMS` list; top bar with page title, simulated "Last synced 4 min ago" and a light/dark toggle (light by default, saved to localStorage, applied before first paint); placeholder pages naming the milestone that fills them; npm scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test`.
- **Files changed:** project config (`package.json`, `tsconfig*.json`, `vite.config.ts`, `.oxlintrc.json`, `components.json`, `index.html`), `src/index.css`, `src/App.tsx`, `src/main.tsx`, `src/lib/{routes,format,utils}.ts`, `src/components/{app-layout,app-sidebar,sync-status,page-placeholder}.tsx`, `src/components/theme/*`, `src/pages/*.tsx`, shadcn components in `src/components/ui/`.
- **Iterations / corrections:**
  - The current Vite template ships oxlint rather than ESLint, and TypeScript 7 removed `baseUrl`. Kept oxlint for `lint` and used `paths` only.
  - `typecheck` runs `tsc -b`, not `tsc --noEmit`: with project references, a root-level `tsc --noEmit` checks no files.
  - shadcn init installed Geist as the font; swapped it for Inter. It also added a `cn` package, which was checked and is shadcn's own replacement for clsx + tailwind-merge.
  - Lint excludes shadcn-generated files (`src/components/ui/`, `src/hooks/use-mobile.ts`), which aren't hand-edited. `no-explicit-any` set to error.
  - Decisions made with the user before starting: light theme default, blue-teal accent not tied to the company name, top-bar filters deferred to M2, a pinned `asOfDate` in 2025 for the data (M1), and the efficiency-leader insight scoped to paid social (M6).
- **What went wrong and how it was fixed:**
  - `SidebarInset` already renders `<main>`, so the page wrapper became a `<div>` to avoid nested `<main>` elements.
  - The header's vertical separator was top-aligned; centered it.
  - Verified with a headless Chrome script: all routes render with the correct title and active nav item, an unknown path redirects to `/`, sidebar navigation and collapse work, the theme toggle persists across reload, Inter loads, no external requests, zero console errors or warnings, checked at 1920×1080 and 1280×720.
  - `npm audit` reports a high-severity advisory in picomatch via vite/vitest (dev tooling only). The only fix offered is `--force` with breaking changes, so left as is for now.
- **Screenshot:** screenshots/m0.png

### M1 — Data generator
- **Start / end:** 2026-11-17 21:44 – 22:14 MST (about 30 min)
- **Prompt(s):** "2025-12-05 is good, go ahead with M1"
- **What was built:**
  - `src/data/`: `types.ts`, `prng.ts` (mulberry32, with a separate seeded stream per campaign), `config.ts` (company, `asOfDate` pinned to 2025-12-05, channel economics, the campaign roster and storyline parameters, all dated as "days before asOfDate"), `calendar.ts` (real Black Friday, Cyber Monday and promo holidays, seasonality curve), `simulate.ts` (funnel for one campaign-day, simulated per creative so creative rows always sum to the campaign row), `effects.ts` (TikTok ramp, creative fatigue), `storylines.ts` (tracking outage, email promo, budgets), `generate.ts` (orchestration plus a memoized `getDataset()`).
  - `src/lib/metrics.ts`: every formula from DATA.md, computed from sums with null on a zero denominator, plus a `METRICS` registry (label, format, good direction), deltas, delta tone and budget pacing.
  - `src/lib/format.ts`: every format in the DESIGN.md table.
  - `src/lib/channels.ts`: channel metadata and the channel → color mapping.
  - Vitest tests for metrics, formatting, the PRNG and generator invariants (24 tests).
  - `npm run data:check`: totals by channel and month, plus 20 checks including all six storylines; exits 1 on any failure.
- **Result:** 6,796 daily facts and 7,132 creative rows across 22 campaigns, 2024-06-13 → 2025-12-04. Generation takes about 20 ms cold. Last 365 days: spend $4.35M, revenue $16.5M, MER 3.8x; search 4.4x, Meta 2.6x, affiliate 10.0x; revenue YoY +26.5%.
  - **Storylines:**
    - Video 03: frequency 1.9 → 4.5, CTR −40%, CPA +34%
    - TikTok 3.7x vs Meta 3.1x ROAS over 30 days on a quarter of the spend
    - Search orders at 12% of normal on Nov 26 with clicks and spend normal
    - Email promo at 3.5× the trailing average on Cyber Monday
    - Black Friday–Cyber Monday spend 2.8× and revenue 3.3× a September day
    - `search_conv_shopping` pacing at 115%
- **Files changed:** `src/data/*`, `src/lib/{metrics,format,channels}.ts` with tests, `scripts/data-check.ts`, `tsconfig.scripts.json`, `tsconfig.json`, `package.json`, `src/index.css` (chart tokens).
- **Iterations / corrections:**
  - Chart colors: replaced the M0 placeholder chart tokens with a categorical palette validated for color-blind separation (adjacent-pair CVD ΔE ≥ 8.4 in both modes). Channels take the slots in order: search blue, Meta orange, TikTok aqua, email yellow, organic pink, affiliate green.
  - First data:check run: MER 4.1x, YoY +61%, holiday spend 3.1×. Fixed by lowering search and Meta add-to-cart rates, starting Shopping and Meta Interest before the window (so growth comes from trend and TikTok rather than launches), halving the holiday-only campaign budgets, and lowering the paid growth trend to 7%/yr.
  - Fatigue parameters are set slightly beyond the doc's numbers (CTR −44%, CPA +40% at the endpoints), so the change measured over the first and last three days lands at about −40% / +35%.
  - New dev dependency: `tsx`, which runs `scripts/data-check.ts` with the `@/` path alias.
- **What went wrong and how it was fixed:**
  - A format test caught `$999.7` instead of `$1K`; compact currency now rounds before choosing a format.
  - Avoided an import cycle by splitting in-simulation storyline effects from the after-the-fact storylines.
  - Row count is about 6.8k rather than DATA.md's estimate of 13–14k, because campaigns start and stop rather than all running 540 days. Not tuned upward, since it doesn't affect anything on screen.
  - Budgets are derived so that month-to-date pacing lands near plan (and at 115% for the over-budget campaign). That's why December budgets include holiday-level spend.
- **Screenshot:** none (no UI changes; data:check output is the evidence)

### M2 — Filters and state
- **Start / end:** 2026-11-17 22:19 – 22:26 MST (about 7 min)
- **Prompt(s):** "is there anything I can see yet, in a browser for example?" (answered: shell only until M2/M3), then "proceed with m2"
- **What was built:**
  - Zustand filter store (`src/store/filters.ts`): date preset or custom range, compare toggle and channels. It reads the URL synchronously at startup, so shared links render correctly on the first paint.
  - Two-way URL sync (`useFilterUrlSync`). Defaults are left out of the URL, unrelated params are kept, and the URL is replaced rather than pushed so history stays clean. Sidebar links carry the current filters.
  - `lib/date-range.ts`: the 7/30/90-day, QTD, YTD and custom presets, clamped to the data. The previous period is the equal-length span immediately before, and it's flagged when it starts before the data does (e.g. YTD).
  - `lib/filter-params.ts`: parse and serialize, with invalid values falling back to defaults.
  - `lib/aggregate.ts`: filter facts, then group by channel, campaign, day (zero-filled) or Monday-start week.
  - `useFilteredData()`: one memoized computation per filter change, shared by every component.
  - Top-bar controls: a date range picker (presets plus a two-month calendar limited to the data's dates), a channel multi-select (color swatches, at least one channel always selected, "Paid media only" shortcut) and the compare switch. "Last synced" collapses to the dot with a tooltip below 1536px wide.
  - Temporary debug panel on Overview: range, previous period, row counts, a check that the daily and weekly series reconcile, a totals table with deltas, and a by-channel table.
  - `data:check -- --from --to` prints totals by channel for any range, to reconcile with the UI.
  - 16 new unit tests (40 total).
- **Verification:** a headless-Chrome test with real mouse events covered the default view, presets, channel toggles, the compare switch, sidebar navigation keeping filters, the back button, a deep link with a custom range and channels, picking a custom range in the calendar, YTD's partial previous period, and invalid params. 10/10 steps pass with zero console errors. Panel totals match data:check exactly: last 30 days $669,707 spend / $2,803,422 revenue / 32,836 orders; Oct 2025 Meta + TikTok spend $229,691.
- **Files changed:** `src/store/*`, `src/lib/{date-range,filter-params,aggregate}.ts` with tests, `src/lib/format.ts` (`formatDateRange`), `src/components/filters/*`, `src/components/{channel-swatch,debug-panel,app-layout,app-sidebar,sync-status}.tsx`, `src/pages/overview.tsx`, `scripts/data-check.ts`, shadcn popover/calendar/switch/card/table/label, `package.json` (zustand; react-day-picker comes with shadcn's calendar).
- **Iterations / corrections:**
  - The store → URL effect reads the store directly rather than the render value, so a back/forward navigation isn't overwritten by stale filters.
  - Replaced a render-time module cache, which oxlint flagged, with a reselect-style `memoizeLast`.
  - Replaced an `as` cast with a typed `QUICK_PRESETS` list.
- **What went wrong and how it was fixed:**
  - The browser test caught the calendar's first click editing the existing range (Nov 5 → Nov 10 → Nov 16 became Nov 5–16). The first click after opening now starts a new range.
  - The screenshot showed the presets and calendar stacked, because shadcn's popover defaults to a column layout; switched it to a row.
  - The build warns that the JS bundle (592 kB, 187 kB gzipped) is over Vite's 500 kB advisory. Left as is for now; route-level code splitting is planned for M9.
- **Screenshot:** screenshots/m2.png

### M3 — Overview page
- **Start / end:** 2026-11-17 22:43 – 22:50 MST (about 7 min)
- **Prompt(s):** "proceed with m3"
- **What was built:**
  - **KPI row:** Spend, Revenue, ROAS, Orders, CPA, New Customers. Each tile has a compact value, a delta arrow and % colored by the metric's good direction (spend stays gray), a tooltip naming the comparison period, and a sparkline with its own tooltip. Deltas hide when compare is off, and read "No full prior period" when the previous period starts before the data (e.g. YTD).
  - **Spend vs. revenue chart:** revenue area (accent) and spend line (neutral gray, matching its neutral delta), with a daily/weekly toggle (daily by default up to 90 days). When compare is on, the previous period appears as dashed, faded lines aligned point for point. The tooltip lists all four series and the matching previous date.
  - **Channel table:** swatch, spend, revenue, ROAS, CPA, CVR and a share-of-spend bar, with a total row. Every column sorts (missing values always last). Rows open `/channels/:channel` with the filters kept, by click or Enter.
  - **Spend mix:** horizontal bars in channel colors with % labels and a tooltip showing share of spend vs. share of revenue. Channels without spend are listed underneath.
  - **Insights preview:** placeholder card with a working "View all" link until M6.
  - Supporting code: `lib/summaries.ts` (view-models so components never compute ratios), `lib/sort.ts`, `SortableHead`, `KpiCard`, `Sparkline`, and a shared `TooltipCard`/`LegendItem` with value-first rows keyed by a line in the series color. Spend and revenue colors are `SERIES_COLORS` in `lib/channels.ts`. Removed the M2 debug panel.
- **Verification:** headless Chrome at 1280×720 and 1920×1080 in both themes, with tooltips hovered, sorting, a row click to `/channels/tiktok`, compare off, weekly mode, YTD and organic-only views. Zero console errors. KPIs and the table total match data:check for the last 30 days: $669,707 spend, $2,803,422 revenue, 32,836 orders, $20.40 CPA, 4.2x ROAS. The Nov 26 tracking-outage dip is visible in the trend chart.
- **Files changed:** `src/components/{overview/*,charts/*,kpi-card,sortable-head}.tsx`, `src/lib/{summaries,sort}.ts`, `src/lib/{aggregate,metrics,format,channels}.ts` with tests, `src/pages/overview.tsx`, `src/index.css` (`--series-neutral`), shadcn chart/badge/toggle-group (adds recharts).
- **Iterations / corrections:**
  - **1280×720 layout:** "vs prior" wrapped in the KPI tiles and the channel table was cramped. "vs prior" now shows from 1536px up (the tooltip still names the period), and the table and spend mix stack below 1536px.
  - **Zero spend:** Organic CPA showed "$0.00". Cost-per metrics (CPC, CPM, CPA, CAC) are now undefined, shown as "—", when spend is zero; there's a test for it.
  - **Weekly buckets:** calendar weeks clipped at both ends of the range made the latest week look like a revenue collapse. Weekly points are now 7-day buckets counted back from the range's last day, so the newest is always complete and the previous period buckets identically. Only the oldest can be short, and its tooltip shows the exact span.
  - Moved `tooltipDatum` to its own file for the fast-refresh lint rule, and replaced a `Granularity` cast with a type guard.
- **What went wrong and how it was fixed:** My first browser-test check for "dashed comparison lines" counted `stroke-dasharray`, which Recharts also sets while animating, so it was meaningless. Verified from screenshots instead.
- **Screenshot:** screenshots/m3.png, screenshots/m3-dark.png

### M4 — Channels and Campaigns
- **Start / end:** 2026-11-17 22:51 – 23:04 MST (about 13 min, including a pause where plan mode was switched on mid-milestone and the remaining steps were written up and approved)
- **Prompt(s):** "proceed with m4", then approval of the plan for the rest of M4
- **What was built:**
  - **Channels page (`/channels/:channel`):**
    - Swatch tabs for all six channels; switching keeps the filters. A bare or invalid channel redirects to the first selected one.
    - Channel-specific KPI tiles (cost metrics only where there's spend).
    - A trend chart with a metric picker (Spend/Revenue/ROAS/CTR/CPA/CVR); spend-based metrics are disabled for organic.
    - A campaigns table, and for Meta and TikTok a creatives table with placeholder thumbnails, CTR, 21-day CTR change, frequency, CPA and a Fatigue badge with an explanatory tooltip.
  - **Campaigns page:**
    - All campaigns with channel badge, status, spend, revenue, ROAS, CPA, a budget pacing bar (used share, a tick at the expected share, red over 110%) and a 30-day spend sparkline.
    - Search, status filter, a count, sortable columns, CSV export of exactly what's shown, and an empty state with "Clear filters".
  - **Campaign drawer:**
    - Opened from any table via `?campaign=id`, so it's linkable and Back closes it. Mounted once in the layout, ready for M6 "View" links.
    - Shows the campaign's KPIs, a trend with metric picker, the month's budget (spent, budget, projected) and its creatives.
  - **Library:**
    - `lib/campaigns.ts`: pacing, 30-day trends, campaign rows.
    - `lib/creatives.ts`: `FATIGUE_RULE` and `fatigueSignal`, shared with the M6 insights engine.
    - `lib/csv.ts`, `lib/exports.ts` (CSV layouts with raw values).
    - `hooks/use-media-query.ts`.
    - Generic `KpiGrid`, `MetricTrendChart`, `MetricPicker`, `PacingBar`, `ChannelBadge`, `StatusBadge`, `ExportButton`.
  - 9 new unit tests (49 total), including "fatigue fires only for Summer Trail – Video 03", "stays quiet in September" and "only search-shopping paces over".
- **Verification:** headless Chrome, 18 checks:
  - Overview row → `/channels/meta?range=7d` → campaign row → `…&campaign=meta-lookalike` with the filters kept, and Back closes the drawer.
  - Fatigue badge on Video 03 only, sorted first.
  - Drawer contents.
  - Tab switching, the organic metric picker, and redirects.
  - Search, status filter, pacing sort (Shopping first at 115.0%, marked over).
  - A real CSV download (header + 22 rows in on-screen order).
  - The empty state.
  - Screenshots at 1280×720 and 1920×1080 in both themes, zero console warnings. The M2 URL suite still passes.
  - Meta spend for the last 30 days on the channel page ($312.3K) matches data:check ($312,274).
- **Decisions:**
  - The global top-bar channel filter is the Campaigns page's channel filter (no duplicate control).
  - Channel tabs show every channel, and the route decides.
  - The drawer's state lives in the URL.
  - Fatigue compares the first and last 3 days of the 21-day window. Comparing weeks diluted it to −33%; 3 days gives 1.9 → 4.5 frequency, CTR −40%, CPA +34%, matching DATA.md and data:check.
- **Files changed:** `src/pages/{channels,campaigns,overview}.tsx`, `src/components/{campaigns/*,channels/*,charts/metric-*.tsx,kpi-grid,kpi-card,channel-badge,status-badge,pacing-bar,export-button,app-layout}.tsx`, `src/lib/{campaigns,creatives,csv,exports,summaries,filter-params}.ts` with tests, `src/hooks/use-media-query.ts`, `src/store/{use-campaign-param,use-filter-url-sync}.ts`, shadcn tabs and select.
- **What went wrong and how it was fixed:**
  - **URL rewrites:** opening the drawer made the URL sync rewrite the query string just to reorder params, because it compared raw strings. It now rewrites only when the filter params aren't canonical (`hasCanonicalFilters`), which also still cleans invalid params like `?range=bogus`.
  - **Clipped tooltips:** sparkline tooltips were cut off by the Card's `overflow-hidden`, a bug since M3 that my text-only check had missed. KPI cards are now `overflow-visible`, and table sparklines put their tooltip to the left so it stays inside the table's scroll area.
  - **Hidden chart columns:** CSS-hiding the table's sparkline column (`hidden 2xl:table-cell`) gave Recharts zero-size containers, producing 100 console warnings. Wide-only columns (30-day trend, channel badge) now aren't rendered below 1536px (`useMediaQuery`), which also stopped the 1280px table overflowing.
  - **Bundle size:** the JS bundle is 1.04 MB (315 kB gzipped), mostly Recharts. Route-level code splitting in M9 is now a priority.
- **Screenshot:** screenshots/m4.png (Meta creatives with the fatigue tooltip), screenshots/m4-drawer.png

### M5 — Funnel
- **Start / end:** 2026-11-17 23:11 – 23:17 MST (about 6 min)
- **Prompt(s):** "m5 then"
- **What was built:**
  - **KPI tiles:** CTR, landing rate, add-to-cart rate, checkout rate, CVR and orders, with deltas and sparklines. The three new step rates are in `lib/metrics.ts`.
  - **Stage chart:** Impressions → Clicks → Sessions → Add to cart → Orders, with counts, step conversion and change vs. the previous period. Counts span ~1000×, so each bar shows the share of the previous stage that continued (a linear 0–100% scale) rather than counts, and the card says so. The biggest drop-off row is highlighted.
  - **Biggest drop-off callout:** the on-site step with the lowest conversion, the people lost, the prior-period rate, and the selected channel converting worst there (it must have ≥2% of the step's volume), with a link to that channel's page. CTR is excluded because it's always the smallest rate in an ad funnel. Last 30 days: Sessions → Add to cart, 11.9% (568,186 lost), with Organic Search lowest at 6.8%.
  - **"Where each channel leaks":** four small multiples, one per step, with a bar per channel in channel colors and a rule at the blended rate.
  - `lib/funnel.ts` (`FUNNEL_STAGES`, `FUNNEL_STEPS`, `funnelStages`, `biggestDropOff`) with 5 tests (54 total).
- **Verification:** headless Chrome, 5 checks:
  - five stages with exactly one highlighted
  - the callout names the step, the weakest channel and the prior rate
  - four panels with a label per channel
  - the callout link → `/channels/organic?range=7d`
  - single channel with compare off → no weakest-channel line and no deltas
  - Both themes at 1920 and 1280, zero console errors.
- **Files changed:** `src/pages/funnel.tsx`, `src/components/funnel/*`, `src/lib/{funnel,metrics}.ts` with tests.
- **What went wrong and how it was fixed:**
  - The drop-off row was first matched by float equality; it now carries the stage key it fails to reach.
  - Value labels in the small multiples were struck through by the blended-rate rule. Recharts 3 draws ReferenceLine (z-index 400) above bars (300) whatever the JSX order, so the rule is now `zIndex={250}`, and labels get a card-colored halo (`paint-order: stroke`) that breaks the line around the text.
  - A scratch inspection command had a stray `cat > /tmp/x.ts` with no input and hung. My attempt to clear it with `pkill -f cat` was rightly blocked as too broad; stopped the specific background task instead and removed the empty file it created.
- **Screenshot:** screenshots/m5.png, screenshots/m5-dark.png

### M6 — Insights
- **Start / end:** 2026-11-18 00:24 – 00:32 MST (about 8 min)
- **Prompt(s):** "m6, go"
- **What was built:**
  - **`lib/insights.ts`:** types, `detectInsights` (ranked by severity then score) and `insightHref` (View URLs laid over the current filters).
  - **`lib/insight-rules.ts`:** the six rules.
  - **`lib/insight-signals.ts`:** day-level signals computed once per dataset.
  - **Rules:**
    - **Tracking gap:** clicks ≥70% of the prior week while orders ≤25%.
    - **Anomaly:** a channel's revenue as a share of the rest of the business, against its same-weekday median of the prior 4 weeks (log residual), z-scored against the trailing 28 days. Flags at |z| ≥ 3 and ≥50% moves, keeping the strongest per channel.
    - **Trend:** a 21-day least-squares fit for spend and revenue, plus per-channel ROAS comparing the first and last week from sums.
    - **Creative fatigue:** reuses the M4 `fatigueSignal`.
    - **Pacing:** over 110% of plan.
    - **Efficiency leader:** best ROAS among the selected paid social channels.
  - **Insights page:** a type filter with counts, and cards with a severity badge (icon + label), title, one-sentence body with real numbers, mini chart (series with the key day marked, a plan or trend line, or ROAS bars) and a View link.
  - **Overview:** the preview shows the top 3, with "View all".
  - Holiday names in `data/calendar.ts`, `formatDecimal`, and a shared `lib/memo.ts` (`memoByDataset`, `memoizeLast`).
- **All six storylines detected, last 30 days. The page shows exactly 7 insights (6 storylines + the revenue/spend trend pair):**
  1. Video 03 frequency 1.9 → 4.5, CTR −39.9%, CPA +34.4%
  2. TikTok 3.7x vs Meta 3.1x on 22.4% of paid social spend
  3. Paid Search Nov 26: clicks 116.6% of normal, orders 58 (11.8%)
  4. Email $9,457 on Cyber Monday, 3.5× its 28-day average
  5. Spend +26.7% and revenue +35.9% over three weeks, through the Black Friday–Cyber Monday peak
  6. `search_conv_shopping` at 115.0% of plan, projected $114,359 vs a $99,400 budget
  - The engine runs in about 10 ms.
- **Verification:**
  - 10 new unit tests (64 total) assert each storyline's numbers, that nothing else fires, warnings-first ordering, channel filtering and exact View URLs.
  - Headless Chrome, 13/13 checks: every View link followed to the right page with the right filters (custom ranges around events; the drawer opens for fatigue and pacing), the type filter, the channel filter narrowing insights, View keeping the current filters, and the Overview top 3 matching the page. Both themes at 1920 and 1280, zero console errors.
- **Files changed:** `src/lib/{insights,insight-rules,insight-signals,memo}.ts` with tests, `src/lib/{campaigns,format}.ts`, `src/data/calendar.ts`, `src/store/{use-insights,use-filtered-data}.ts`, `src/components/insights/*`, `src/components/overview/{insights-preview,spend-revenue-chart}.tsx`, `src/pages/insights.tsx`.
- **Iterations / corrections:**
  - **Anomaly model:** a plain z-score of daily revenue against the trailing 28 days was useless. The November ramp flagged ~90 channel-days, and the Cyber Monday email promo scored only z=2.6 because Tuesday/Thursday sends make email noisy. Normalizing to share-of-rest-of-business (cancels seasonality) with a same-weekday baseline (cancels send days) flags 17 of 2,904 channel-days across the whole history, all real events: promo sends, TikTok's launch, the affiliate creators launch.
  - **Outage spillover:** on Nov 26 the search outage shrank total revenue, so every other channel's share "spiked". Excluding search from the denominator made it worse (it's the biggest channel). It's now imputed at its prior-week average on gap days, which removed all four false anomalies.
  - Reworded the anomaly text from "far outside its normal range" (odd next to "1.2x") to "an unusual move against the rest of the business".
  - The Overview preview made the insights column taller than the trend chart. Preview cards now clamp to two lines, and the chart grows to fill the row.
- **Screenshot:** screenshots/m6.png (Insights), screenshots/m6-overview.png
