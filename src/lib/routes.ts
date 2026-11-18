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
}

// Single list that drives the sidebar, the top-bar title and (later) the ⌘K palette.
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', title: 'Overview', icon: LayoutDashboard },
  { path: '/channels', title: 'Channels', icon: Activity },
  { path: '/campaigns', title: 'Campaigns', icon: Megaphone },
  { path: '/funnel', title: 'Funnel', icon: Filter },
  { path: '/planner', title: 'Budget Planner', icon: SlidersHorizontal },
  { path: '/insights', title: 'Insights', icon: Lightbulb },
  { path: '/sources', title: 'Data Sources', icon: Database },
]

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/'
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname))
}
