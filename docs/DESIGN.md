# Design

## Direction
Calm, modern SaaS analytics, with the restraint of the Linear, Stripe and Vercel dashboards: information-dense but uncluttered. It should look like a product someone would pay for.

## Basics
- shadcn/ui theme on a neutral (zinc) base with one brand accent color.
- Font: Inter, bundled locally (no Google Fonts CDN; the app must work offline).
- Tabular numerals for every number (Tailwind `tabular-nums`) so columns and KPI values don't jitter.
- Cards: 1px subtle border, small radius, little or no shadow.
- Consistent spacing: 16px/24px grid gaps, generous padding inside cards.
- Light and dark modes are both first-class. Test both on the actual projector; light often reads better in a bright room.

## Color
- The UI stays neutral. Color is reserved for data and status.
- One fixed channel → color mapping in lib/channels.ts, used everywhere (charts, badges, legends). Map the six channels to shadcn chart tokens `--chart-1` … `--chart-6` (add a sixth token).
- Don't use real platforms' brand colors.
- Colors must stay distinguishable for color-blind viewers. Never rely on color alone; pair it with labels or legends.
- Status: green = good, red = bad, amber = warning.
- Delta coloring follows each metric's "good direction" from DATA.md. A CPA drop is green. Spend is neutral, so its delta is gray.

## Number formatting (lib/format.ts)

| Type | Example |
|---|---|
| Currency, compact (tiles, axes) | $1.2M · $84.3K · $912 |
| Currency, full (tables, tooltips) | $84,312 |
| Unit cost | $1.23 |
| Percent | 3.4% |
| ROAS / MER | 3.2x |
| Delta | +12.4% / −3.1% (true minus sign) |
| Date on axis | Nov 17 |
| Date in tooltip | Nov 17, 2026 |
| Missing / divide by zero | — |

## Charts
- Lines or areas for time series, bars for comparing categories. Avoid pie charts.
- Bar axes start at zero.
- Horizontal gridlines only, light. No chart borders. Abbreviated axis labels.
- A tooltip on every chart showing all series, formatted.
- The comparison period uses the same color, dashed, at lower opacity.
- Subtle motion: ≤300 ms on first render and on filter changes.

## Projector checklist
- Body text at least 14px; KPI values 28px or larger.
- Check contrast at 1280×720.
- No meaning carried only by thin 1px lines or faint colors.
