import * as XLSX from 'xlsx'

export type ParsedSheet = {
  headers: string[]
  rows: Record<string, unknown>[]
}

export function parseExcel(buffer: ArrayBuffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[firstSheetName]

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  })

  const headers = Object.keys(rows[0] ?? {})
  return { headers, rows }
}

export function hashBuffer(buffer: ArrayBuffer): string {
  // Basit bir hash: JSON uzunluğu + ilk/son baytlar
  const view = new Uint8Array(buffer)
  let acc = 0
  for (let i = 0; i < view.length; i += Math.ceil(view.length / 5000) || 1) {
    acc = (acc * 33 + view[i]) >>> 0
  }
  return `h${acc.toString(16)}`
}

// Excel tarih hücreleri sayı olarak gelebilir; bu yardımcı fonksiyon
// metin veya sayı formatlarını JS Date'e dönüştürmeyi dener.
export function toDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof val === 'number') {
    const parsed = XLSX.SSF?.parse_date_code?.(val)
    if (parsed) {
      const d = new Date(Date.UTC(parsed.y, (parsed.m || 1) - 1, parsed.d || 1, parsed.H || 0, parsed.M || 0, parsed.S || 0))
      return d
    }
  }
  return null
}

// Başlık normalizasyonu: trim, küçük harf, diakritik kaldırma, çoklu boşlukları tek boşluk yapma,
// tire ve noktalama kaldırma
export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    out[normalizeKey(k)] = v
  }
  return out
}



