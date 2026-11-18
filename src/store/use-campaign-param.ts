import { useSearchParams } from 'react-router'

/** The campaign drawer lives in the URL (?campaign=id), so it's linkable and Back closes it. */
export function useCampaignParam() {
  const [params, setParams] = useSearchParams()
  const update = (id: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (id) next.set('campaign', id)
      else next.delete('campaign')
      return next
    })

  return { campaignId: params.get('campaign'), openCampaign: (id: string) => update(id), closeCampaign: () => update(null) }
}
