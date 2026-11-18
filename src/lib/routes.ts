import {
  Activity,
  Database,
  Filter,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  title: string
  icon: LucideIcon
  /** False for pages that ignore the global date and channel filters, so the top bar hides them. */
  usesFilters: boolean
}

// Single list that drives the sidebar, the top-bar title and (later) the ⌘K palette.
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', title: 'Overview', icon: LayoutDashboard, usesFilters: true },
  { path: '/channels', title: 'Channels', icon: Activity, usesFilters: true },
  { path: '/campaigns', title: 'Campaigns', icon: Megaphone, usesFilters: true },
  { path: '/funnel', title: 'Funnel', icon: Filter, usesFilters: true },
  { path: '/planner', title: 'Budget Planner', icon: SlidersHorizontal, usesFilters: false },
  { path: '/insights', title: 'Insights', icon: Lightbulb, usesFilters: true },
  { path: '/sources', title: 'Data Sources', icon: Database, usesFilters: false },
]

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/'
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname))
}
