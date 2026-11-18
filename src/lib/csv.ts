export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

const escape = (value: string | number | null | undefined): string => {
  if (value == null) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** RFC 4180 CSV with raw (unformatted) values, so the file opens cleanly in a spreadsheet. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines = [columns.map((c) => escape(c.header)).join(',')]
  for (const row of rows) lines.push(columns.map((c) => escape(c.value(row))).join(','))
  return `${lines.join('\r\n')}\r\n`
}

/** Saves a CSV in the browser. Purely local: a Blob URL, no network. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
