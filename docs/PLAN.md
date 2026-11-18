# Build plan

Work one milestone at a time. Every milestone ends with typecheck and build passing, a BUILD_LOG entry, and a commit.

## M0 — Scaffold
- [x] Vite + React + TypeScript project, strict mode
- [x] Tailwind + shadcn/ui initialized; Inter bundled locally
- [x] React Router with placeholder pages for every route in SCREENS.md
- [x] App shell: sidebar, top bar, light/dark toggle persisted in localStorage
- [x] npm scripts: dev, build, preview, typecheck, lint, test

**Done when:** every route navigates, the theme toggle works, and the build passes.

## M1 — Data generator
- [x] data/types.ts, data/config.ts, data/prng.ts
- [x] data/generate.ts implementing DATA.md, including seasonality and all six storylines
- [x] lib/metrics.ts and lib/format.ts, with Vitest tests for formulas and formatting
- [x] lib/channels.ts with channel metadata and colors
- [x] `npm run data:check`: prints totals by channel and month and verifies funnel monotonicity and ROAS ranges

**Done when:** data:check passes, totals look plausible, and generation takes under 200 ms.

## M2 — Filters and state
- [x] Zustand store: date range, compare toggle, channels
- [x] Two-way sync with the URL query string
- [x] Selectors: filter facts; aggregate by day, week, channel and campaign; compute the matching previous period

**Done when:** changing filters updates a temporary debug panel with correct totals.

## M3 — Overview page
- [x] KPI tiles with deltas and sparklines
- [x] Spend vs. revenue chart with granularity toggle and compare overlay
- [x] Channel table and spend mix
- [x] Insights preview (placeholder until M6)

**Done when:** it matches SCREENS.md §1 and the numbers reconcile with data:check for the same range.

## M4 — Channels and Campaigns
- [x] Channels page with tabs, metric picker and creatives table
- [x] Campaigns page with search, filters, sorting, CSV export
- [x] Campaign detail drawer

**Done when:** clicking from Overview → Channel → Campaign keeps the filters, and the creative fatigue is visible in the Meta creatives table.

## M5 — Funnel
- [x] Funnel chart with step conversion rates
- [x] By-channel comparison and biggest-drop-off callout

## M6 — Insights
- [x] lib/insights.ts with the six rule types
- [x] Insights page plus the Overview preview wired up
- [x] Each "View" link opens the right page with the right filters

**Done when:** all six planted storylines appear as insights with correct numbers.

## M7 — Budget planner
- [x] Response curves calibrated to the last 30 days
- [x] Sliders, number inputs, lock-total rebalancing
- [x] Projections and per-channel curve charts
- [x] Optimize button with animated sliders

**Done when:** Optimize moves budget toward TikTok and away from Meta, and the projected totals update live.

## M8 — Data Sources (simulated)
- [ ] Source cards
- [ ] Connect modal → progress → connected
- [ ] Sync now

## M9 — Polish
- [ ] Skeletons, empty states, transitions
- [ ] CSV export on every table
- [ ] ⌘K command palette
- [ ] Layout check at 1920×1080 and 1280×720
- [ ] Accessibility pass: keyboard navigation, focus states, contrast

## M10 — Ship
- [ ] Static build deployed (Vercel, Netlify or GitHub Pages)
- [ ] Runs fully offline via `npm run preview`
- [ ] Zero console errors or warnings
- [ ] Dry run on the presentation laptop and projector
- [ ] BUILD_LOG summary filled in

## Backlog
- "Ask your data" box backed by a real LLM call (out of scope for now)
- A rehearsed feature to live-build on stage
