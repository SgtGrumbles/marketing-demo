import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from './use-theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Switch to {next} mode</TooltipContent>
    </Tooltip>
  )
}
