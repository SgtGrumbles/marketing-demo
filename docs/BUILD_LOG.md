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
