import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('writes a header and raw values, escaping commas, quotes and newlines', () => {
    const rows = [{ name: 'Summer Trail – Video 03', spend: 1234.5, note: 'says "hi", twice' }, { name: 'a\nb', spend: null, note: '' }]
    const csv = toCsv(rows, [
      { header: 'Name', value: (r) => r.name },
      { header: 'Spend', value: (r) => r.spend },
      { header: 'Note', value: (r) => r.note },
    ])
    expect(csv).toBe('Name,Spend,Note\r\nSummer Trail – Video 03,1234.5,"says ""hi"", twice"\r\n"a\nb",,\r\n')
  })
})
