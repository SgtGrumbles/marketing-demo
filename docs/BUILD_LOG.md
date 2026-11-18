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
