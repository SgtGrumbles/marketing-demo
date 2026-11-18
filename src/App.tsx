import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppLayout } from '@/components/app-layout'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CampaignsPage } from '@/pages/campaigns'
import { ChannelsPage } from '@/pages/channels'
import { FunnelPage } from '@/pages/funnel'
import { InsightsPage } from '@/pages/insights'
import { OverviewPage } from '@/pages/overview'
import { PlannerPage } from '@/pages/planner'
import { SourcesPage } from '@/pages/sources'

const router = createBrowserRouter([
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
])

export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  )
}
