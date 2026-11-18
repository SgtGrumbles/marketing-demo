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
