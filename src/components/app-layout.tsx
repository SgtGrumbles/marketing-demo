import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { CampaignDrawer } from '@/components/campaigns/campaign-drawer'
import { CommandPalette } from '@/components/command-palette'
import { FilterBar } from '@/components/filters/filter-bar'
import { PageSkeleton } from '@/components/page-skeleton'
import { SyncStatus } from '@/components/sync-status'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { findNavItem } from '@/lib/routes'
import { useFilterUrlSync } from '@/store/use-filter-url-sync'

export function AppLayout() {
  useFilterUrlSync()
  const { pathname } = useLocation()
  const page = findNavItem(pathname)

  return (
    <SidebarProvider>
      <a href="#content" className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5 data-vertical:self-center" />
          <h1 className="mr-2 text-lg font-semibold tracking-tight whitespace-nowrap">{page?.title ?? 'Pulse'}</h1>
          {page?.usesFilters !== false && <FilterBar />}
          <div className="ml-auto flex items-center gap-3">
            <SyncStatus />
            <ThemeToggle />
          </div>
        </header>
        <div id="content" tabIndex={-1} className="flex-1 p-6 outline-none">
          <Suspense fallback={<PageSkeleton />}>
            {/* Keyed by page, so each one fades in on arrival. */}
            <div key={page?.path ?? pathname} className="animate-in duration-200 fade-in motion-reduce:animate-none">
              <Outlet />
            </div>
          </Suspense>
        </div>
        <CampaignDrawer />
        <CommandPalette />
      </SidebarInset>
    </SidebarProvider>
  )
}
