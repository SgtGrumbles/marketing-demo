import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { CampaignDrawer } from '@/components/campaigns/campaign-drawer'
import { FilterBar } from '@/components/filters/filter-bar'
import { SyncStatus } from '@/components/sync-status'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { findNavItem } from '@/lib/routes'
import { useFilterUrlSync } from '@/store/use-filter-url-sync'

export function AppLayout() {
  useFilterUrlSync()
  const { pathname } = useLocation()
  const title = findNavItem(pathname)?.title ?? 'Pulse'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5 data-vertical:self-center" />
          <h1 className="mr-2 text-lg font-semibold tracking-tight whitespace-nowrap">{title}</h1>
          <FilterBar />
          <div className="ml-auto flex items-center gap-3">
            <SyncStatus />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
        <CampaignDrawer />
      </SidebarInset>
    </SidebarProvider>
  )
}
