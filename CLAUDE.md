# CLAUDE.md

## What this is
Pulse is a proof-of-concept marketing analytics dashboard for a fictional brand, Fernleaf Supply Co. It runs entirely in the browser on generated dummy data. Its purpose is to show an audience of marketers that a polished, working dashboard can be built quickly with generative code. It is not production software.

Priorities, in order:
1. Looks polished and professional on a projector and on a laptop
2. Every visible control works (filters, drill-downs, sliders, toggles)
3. Numbers are internally consistent (totals match breakdowns, derived metrics match their inputs)
4. Code is clean enough to show on screen

## Ground rules
- Dummy data only. No backend, no auth, no real API calls, no runtime network requests.
- Must run fully offline after `npm run build` (no CDN fonts, scripts or images).
- Simulated features are fine (see docs/PRODUCT.md) but must behave believably.
- Prefer shadcn/ui components over custom ones. Don't add a dependency without saying why.
- Don't use real company logos or platform brand colors. Use generic icons or lettermarks.
- Ask before changing docs/ files, except ticking boxes in PLAN.md and appending to BUILD_LOG.md.

## Stack
- Vite + React + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Recharts, via shadcn/ui chart components
- React Router for pages
- Zustand for global filter state
- date-fns for dates
- Vitest for the few unit tests we need

## Commands
- `npm run dev`: dev server
- `npm run build`: production build (must pass with zero errors)
- `npm run preview`: serve the build locally
- `npm run typecheck`: `tsc --noEmit`
- `npm run lint`
- `npm run test`
- `npm run data:check`: prints data sanity checks (added in M1)

## Project layout
```
src/
  pages/            one file per route
  components/       shared UI (kpi-card, chart wrappers, filter bar)
  components/ui/    shadcn-generated components (don't hand-edit)
  data/             types.ts, config.ts, prng.ts, generate.ts
  lib/metrics.ts    every metric formula: single source of truth
  lib/format.ts     number, currency, percent and date formatting
  lib/channels.ts   channel metadata and the channel → color mapping
  lib/insights.ts   rule-based insight detection
  store/            Zustand stores
```

## Conventions
- All metric math lives in lib/metrics.ts. Components never compute ratios inline.
- Ratios are computed from summed components (sum(clicks) / sum(impressions)), never by averaging daily ratios.
- All displayed numbers go through lib/format.ts.
- Chart and badge colors come from lib/channels.ts. Never hard-code a color in a chart.
- Random numbers come only from the seeded PRNG in data/prng.ts. Never use Math.random().
- No `any`. Split files that grow past ~300 lines.

## Workflow
1. Read docs/PLAN.md and work on the next unchecked milestone only.
2. Before calling a milestone done: `npm run typecheck` and `npm run build` pass, no browser console errors, and the acceptance criteria are met.
3. Tick the milestone's boxes in docs/PLAN.md, append an entry to docs/BUILD_LOG.md, then commit with the message `M<n>: <summary>`.

## Docs
- docs/PRODUCT.md: scope, features, what's real vs simulated, non-goals
- docs/DATA.md: the fictional company, data model, generator rules, planted storylines
- docs/SCREENS.md: every page and widget
- docs/DESIGN.md: visual direction, colors, number formatting, chart rules
- docs/PLAN.md: milestones and acceptance criteria
- docs/BUILD_LOG.md: running log of prompts, time and fixes
