import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { CalendarRange, GitCompareArrows, Moon, RotateCcw, Sparkles, Sun } from 'lucide-react'
import { ChannelSwatch } from '@/components/channel-swatch'
import { useTheme } from '@/components/theme/use-theme'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { getDataset } from '@/data/generate'
import { CHANNEL_LIST } from '@/lib/channels'
import { QUICK_PRESETS } from '@/lib/date-range'
import { DEFAULT_FILTERS, filterSearch } from '@/lib/filter-params'
import { allocationTotal, optimizeAllocation, plannerBaseline } from '@/lib/planner'
import { NAV_ITEMS } from '@/lib/routes'
import { useCommandPalette } from '@/store/command-palette'
import { useFilterStore } from '@/store/filters'
import { usePlannerStore } from '@/store/planner'

/** ⌘K: jump to any page, channel or campaign, or change filters and theme, from the keyboard. */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const navigate = useNavigate()
  const location = useLocation()
  const { filters, setPreset, setCompare, replaceFilters } = useFilterStore()
  const { theme, setTheme } = useTheme()
  const search = filterSearch(filters)
  const campaigns = getDataset().campaigns

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!useCommandPalette.getState().open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }
  const go = (pathname: string) => run(() => navigate({ pathname, search }))
  // Campaigns open in the drawer on top of whatever page is showing.
  const openCampaign = (id: string) =>
    run(() => {
      const params = new URLSearchParams(location.search)
      params.set('campaign', id)
      navigate({ pathname: location.pathname, search: params.toString() })
    })
  const optimize = run(() => {
    navigate({ pathname: '/planner', search })
    const baseline = plannerBaseline(getDataset())
    const { allocation, animateTo } = usePlannerStore.getState()
    // Give the page a frame to mount so the sliders are seen moving.
    window.setTimeout(() => animateTo(optimizeAllocation(baseline, allocationTotal(allocation))), 150)
  })

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump to a page, channel or campaign, or run an action">
      <Command>
        <CommandInput placeholder="Search pages, channels, campaigns…" />
        <CommandList className="max-h-[min(420px,60vh)]">
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.path} value={`page ${item.title}`} onSelect={go(item.path)}>
                <item.icon />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Channels">
            {CHANNEL_LIST.map((channel) => (
              <CommandItem key={channel.key} value={`channel ${channel.label}`} keywords={[channel.platform]} onSelect={go(`/channels/${channel.key}`)}>
                <ChannelSwatch channel={channel.key} />
                {channel.label}
                <CommandShortcut>{channel.platform}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Campaigns">
            {campaigns.map((campaign) => (
              <CommandItem key={campaign.id} value={`campaign ${campaign.name}`} keywords={[campaign.channel]} onSelect={openCampaign(campaign.id)}>
                <ChannelSwatch channel={campaign.channel} />
                <span className="truncate font-mono text-[13px]">{campaign.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Date range">
            {QUICK_PRESETS.map((preset) => (
              <CommandItem key={preset.key} value={`range ${preset.label}`} onSelect={run(() => setPreset(preset.key))}>
                <CalendarRange />
                {preset.label}
                {filters.range === preset.key && <CommandShortcut>Current</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem value="action compare previous period" onSelect={run(() => setCompare(!filters.compare))}>
              <GitCompareArrows />
              {filters.compare ? 'Hide previous period' : 'Compare to previous period'}
            </CommandItem>
            <CommandItem value="action reset filters" onSelect={run(() => replaceFilters(DEFAULT_FILTERS))}>
              <RotateCcw />
              Reset filters
            </CommandItem>
            <CommandItem value="action optimize budget planner" onSelect={optimize}>
              <Sparkles />
              Optimize budget plan
            </CommandItem>
            <CommandItem value="action theme dark light mode" onSelect={run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? <Sun /> : <Moon />}
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
