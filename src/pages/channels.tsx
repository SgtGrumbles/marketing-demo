import { useParams } from 'react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export function ChannelsPage() {
  const { channel } = useParams()
  const scope = channel ? `the “${channel}” channel` : 'each channel'

  return <PagePlaceholder description={`Tabs, KPIs, trend chart, campaigns and creatives for ${scope}.`} milestone="M4" />
}
