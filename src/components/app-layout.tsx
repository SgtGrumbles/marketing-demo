import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SyncStatus } from '@/components/sync-status'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { findNavItem } from '@/lib/routes'

export function AppLayout() {
  const { pathname } = useLocation()
  const title = findNavItem(pathname)?.title ?? 'Pulse'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5 data-vertical:self-center" />
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {/* Date range, compare toggle and channel filter land here in M2. */}
          <div className="ml-auto flex items-center gap-3">
            <SyncStatus />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
