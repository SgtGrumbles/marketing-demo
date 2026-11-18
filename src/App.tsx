import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppLayout } from '@/components/app-layout'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { lazyPage } from '@/lib/lazy-page'

// Each page is its own chunk; AppLayout shows a skeleton while one loads.
const OverviewPage = lazyPage(() => import('@/pages/overview'), (m) => m.OverviewPage)
const ChannelsPage = lazyPage(() => import('@/pages/channels'), (m) => m.ChannelsPage)
const CampaignsPage = lazyPage(() => import('@/pages/campaigns'), (m) => m.CampaignsPage)
const FunnelPage = lazyPage(() => import('@/pages/funnel'), (m) => m.FunnelPage)
const PlannerPage = lazyPage(() => import('@/pages/planner'), (m) => m.PlannerPage)
const InsightsPage = lazyPage(() => import('@/pages/insights'), (m) => m.InsightsPage)
const SourcesPage = lazyPage(() => import('@/pages/sources'), (m) => m.SourcesPage)

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <OverviewPage /> },
        { path: 'channels/:channel?', element: <ChannelsPage /> },
        { path: 'campaigns', element: <CampaignsPage /> },
        { path: 'funnel', element: <FunnelPage /> },
        { path: 'planner', element: <PlannerPage /> },
        { path: 'insights', element: <InsightsPage /> },
        { path: 'sources', element: <SourcesPage /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  // Matches Vite's base, so the app also works under a path prefix like /marketing-demo/.
  { basename: import.meta.env.BASE_URL },
)

export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  )
}
