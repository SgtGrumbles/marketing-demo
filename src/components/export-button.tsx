import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'

/** Builds the CSV only when clicked, from exactly the rows on screen. */
export function ExportButton({ filename, build }: { filename: string; build: () => string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => downloadCsv(filename, build())}>
      <Download />
      Export CSV
    </Button>
  )
}
