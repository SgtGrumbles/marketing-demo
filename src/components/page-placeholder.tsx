import { Construction } from 'lucide-react'

interface PagePlaceholderProps {
  description: string
  milestone: string
}

// Temporary body for pages that haven't been built yet.
export function PagePlaceholder({ description, milestone }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <Construction className="size-8 text-muted-foreground" />
      <p className="max-w-md text-muted-foreground">{description}</p>
      <p className="text-sm font-medium text-primary">Coming in {milestone}</p>
    </div>
  )
}
