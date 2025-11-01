'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function FilterModal({ onClose }: { onClose: () => void }) {
  const [columns, setColumns] = useState<string[]>([])
  const [columnsLoading, setColumnsLoading] = useState<boolean>(true)
  const [terms, setTerms] = useState<Record<string, string>>({})
  const [dateKey, setDateKey] = useState<string>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{id:string; rowIndex:number; columns: Record<string, unknown>}[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pdfLoading, setPdfLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    const run = async () => {
      setColumnsLoading(true)
      try {
        const res = await fetch('/api/rows?page=1&pageSize=1')
        const data = await res.json()
        const cols: string[] = (data.columns || []).filter((h:string)=>!!h && !/^empty(\s|\d)*$/i.test(h.trim()))
        setColumns(cols)
        const guess = cols.find(c => c.toLowerCase().includes('tarih')) || ''
        setDateKey(guess)
      } finally {
        setColumnsLoading(false)
      }
    }
    run()
  }, [])

  const applyFilters = async (nextPage: number = 1) => {
    setLoading(true)
    try {
      const filters = { terms, from: from || undefined, to: to || undefined, dateKey: dateKey || undefined }
      const params = new URLSearchParams({ filters: JSON.stringify(filters), page: String(nextPage), pageSize: String(pageSize) })
      const res = await fetch(`/api/rows?${params.toString()}`)
      const data = await res.json()
      setRows(data.rows || [])
      setTotal(Number(data.total || 0))
      setPage(Number(data.page || nextPage))
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    // Filtre aktifse tüm sonuçları (maks 5000) çekip indir
    const hasAnyFilter = Object.values(terms).some(v=>!!v) || !!dateKey || !!from || !!to
    let exportRows = rows
    if (hasAnyFilter) {
      const filters = { terms, from: from || undefined, to: to || undefined, dateKey: dateKey || undefined }
      const params = new URLSearchParams({ filters: JSON.stringify(filters), page: '1', pageSize: String(Math.max(total || 0, 5000)) })
      try {
        const res = await fetch(`/api/rows?${params.toString()}`)
        const data = await res.json()
        exportRows = data.rows || rows
      } catch {}
    }
    if (!exportRows.length) return
    const data = exportRows.map((r: any) => {
      const obj: Record<string, any> = {}
      columns.forEach(c => { obj[c] = r.columns?.[c] ?? '' })
      return obj
    })
    const ws = XLSX.utils.json_to_sheet(data, { header: columns })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Filtre Sonucu')
    XLSX.writeFile(wb, 'filtre-sonucu.xlsx')
  }

  const exportPdf = async () => {
    // Filtre aktifse tüm sonuçları (maks 5000) çekip indir
    setPdfLoading(true)
    try {
      const hasAnyFilter = Object.values(terms).some(v=>!!v) || !!dateKey || !!from || !!to
      let exportRows = rows
      if (hasAnyFilter) {
        const filters = { terms, from: from || undefined, to: to || undefined, dateKey: dateKey || undefined }
        const params = new URLSearchParams({ filters: JSON.stringify(filters), page: '1', pageSize: String(Math.max(total || 0, 5000)) })
        try {
          const res = await fetch(`/api/rows?${params.toString()}`)
          const data = await res.json()
          exportRows = data.rows || rows
        } catch {}
      }
      if (!exportRows.length) return

      const requiredHeaders = [
        'TCGB Tescil Tarihi',
        'GTIP Açıklaması',
        '31.Ticari Tanımı',
        'Ölçü (Eşya) Miktarı',
        'Ölçü Birimi',
        'Fatura Tutarı',
        'Fatura Tutarı Döviz Türü Kodu',
      ]

      const norm = (s:string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const normLoose = (s:string) => norm(s).replace(/[^a-z0-9]+/g, '')
      const dropDigits = (s:string) => norm(s).replace(/\d+/g, '').replace(/[^a-z0-9]+/g, '')

      const getColumnKey = (label: string): string => {
        const tStrict = norm(label)
        const tLoose = normLoose(label)
        const tNoDigits = dropDigits(label)

        // 1) Tam eşleşme (strict)
        let found = columns.find(c => norm(c) === tStrict)
        if (found) return found

        // 2) Tam eşleşme (loose)
        found = columns.find(c => normLoose(c) === tLoose)
        if (found) return found

        // 3) Rakamları yok sayan eşleşme
        found = columns.find(c => dropDigits(c) === tNoDigits)
        if (found) return found

        // 4) İçeren (strict)
        found = columns.find(c => norm(c).includes(tStrict) || tStrict.includes(norm(c)))
        if (found) return found

        // 5) İçeren (loose)
        found = columns.find(c => normLoose(c).includes(tLoose) || tLoose.includes(normLoose(c)))
        if (found) return found

        // 6) Özel: "31.Ticari Tanımı" varyasyonları
        const isTicari = tLoose.includes('ticari') && tLoose.includes('tanimi')
        if (isTicari) {
          found = columns.find(c => {
            const lc = normLoose(c)
            return lc.includes('ticari') && (lc.includes('tanim') || lc.includes('tanimi'))
          })
          if (found) return found
        }

        return label
      }

      const headerKeys = requiredHeaders.map((h) => getColumnKey(h))

      const tableRows: string[][] = exportRows.map((r:any) => {
        return headerKeys.map((key) => {
          const val = r.columns?.[key]
          return val == null ? '' : String(val)
        })
      })

      const res = await fetch('/api/export/html-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: requiredHeaders, rows: tableRows }),
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data?.message || 'PDF oluşturulamadı')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'filtre-sonucu.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e:any) {
      toast.error(e.message || 'PDF oluşturulamadı, lütfen tekrar deneyin.')
    } finally {
      setPdfLoading(false)
    }
  }

  const header = useMemo(()=>columns, [columns])

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Filtreleme işlemleri</h3>
            <Button variant="outline" onClick={onClose}>Kapat</Button>
          </div>
          <div className="p-4 overflow-auto max-h-[32vh]">
            {/* Dinamik text alanları */}
            {columnsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="h-6 w-6" />
                <span className="ml-3 text-sm text-gray-600">Form alanları yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {columns.map(c => (
                  <div key={c} className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">{c}</label>
                    <input className="px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder={`${c} içerir...`} value={terms[c] || ''} onChange={(e)=>setTerms(prev=>({...prev, [c]: e.target.value}))} />
                  </div>
                ))}
              </div>
            )}
            {/* Tarih aralığı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Tarih Kolonu</label>
                <select className="px-3 py-2 border rounded-md bg-white text-gray-900" value={dateKey} onChange={(e)=>setDateKey(e.target.value)} disabled={columnsLoading || !columns.length}>
                  <option value="">Seçiniz (opsiyonel)</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Başlangıç</label>
                <input type="date" className="px-3 py-2 border rounded-md bg-white text-gray-900" value={from} onChange={(e)=>setFrom(e.target.value)} disabled={columnsLoading} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Bitiş</label>
                <input type="date" className="px-3 py-2 border rounded-md bg-white text-gray-900" value={to} onChange={(e)=>setTo(e.target.value)} disabled={columnsLoading} />
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-end gap-2 border-t bg-white">
            <Button variant="outline" onClick={()=>{ setTerms({}); setFrom(''); setTo(''); setPage(1); setTotal(0); setRows([]); setSelected(new Set()) }}>Temizle</Button>
            <Button className='bg-green-600 hover:bg-green-700 text-white' variant="outline" onClick={exportExcel} disabled={!rows.length}>Excel olarak indir</Button>
            <Button className='bg-indigo-600 hover:bg-indigo-700 text-white' variant="outline" onClick={exportPdf} disabled={!rows.length || pdfLoading}>{pdfLoading ? 'PDF hazırlanıyor...' : 'PDF olarak indir'}</Button>
            <Button onClick={()=>applyFilters(1)} disabled={loading}>{loading ? 'Uygulanıyor...' : 'Uygula'}</Button>
          </div>
          <div className="p-0 overflow-auto max-h-[42vh]">
            <div className="min-w-[1000px]">
              {loading && (
                <div className="p-6 flex items-center justify-center">
                  <Spinner className="h-8 w-8" />
                  <span className="ml-3 text-sm text-gray-600">Filtre sonucu getiriliyor...</span>
                </div>
              )}
              <Table>
                <THead>
                  <TR>
                    <TH>Seç</TH>
                    {header.map(h => <TH key={h}>{h}</TH>)}
                  </TR>
                </THead>
                <TBody>
                  {rows.map((r)=> (
                    <TR key={r.id}>
                      <TD>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={()=> setSelected(prev=>{ const n = new Set(prev); n.has(r.id)? n.delete(r.id): n.add(r.id); return n })} />
                      </TD>
                      {header.map(c => (
                        <TD key={c}>{r.columns?.[c] == null ? '' : String(r.columns[c])}</TD>
                      ))}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="flex items-center justify-between p-3 border-t sticky bottom-0 bg-white">
              <div className="text-sm text-gray-600">Toplam: {total} • Sayfa {Math.max(1, page)}/{Math.max(1, Math.ceil(total / pageSize))}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => applyFilters(Math.max(1, page - 1))} disabled={page <= 1 || loading}>
                  Geri
                </Button>
                <Button onClick={() => applyFilters(Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1))} disabled={page >= Math.max(1, Math.ceil(total / pageSize)) || loading}>
                  İleri
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
