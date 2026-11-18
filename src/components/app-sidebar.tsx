import { NavLink, useLocation } from 'react-router'
import { Activity, Search } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { filterSearch } from '@/lib/filter-params'
import { NAV_ITEMS, isNavItemActive } from '@/lib/routes'
import { COMMAND_SHORTCUT, useCommandPalette } from '@/store/command-palette'
import { useFilterStore } from '@/store/filters'

export function AppSidebar() {
  const { pathname } = useLocation()
  const search = filterSearch(useFilterStore((state) => state.filters))
  const openPalette = useCommandPalette((state) => state.setOpen)

  return (
    <Sidebar collapsible="icon">
      <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Pulse">
                <NavLink to={{ pathname: '/', search }}>
                  <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Activity className="size-4" />
                  </span>
                  <span className="text-base font-semibold tracking-tight">Pulse</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => openPalette(true)} tooltip={`Search (${COMMAND_SHORTCUT})`} className="text-muted-foreground">
                <Search />
                <span>Search</span>
                <kbd className="ml-auto rounded border bg-background px-1.5 font-sans text-xs">{COMMAND_SHORTCUT}</kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isNavItemActive(item, pathname)} tooltip={item.title}>
                      <NavLink to={{ pathname: item.path, search }}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </nav>
      <SidebarRail />
    </Sidebar>
  )
}
