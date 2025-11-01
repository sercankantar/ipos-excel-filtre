'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'

export default function DeleteModal({ onClose, onDeleted }: { onClose: () => void; onDeleted?: () => void }) {
  const [columns, setColumns] = useState<string[]>([])
  const [terms, setTerms] = useState<Record<string, string>>({})
  const [dateKey, setDateKey] = useState<string>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{id:string; rowIndex:number; columns: Record<string, unknown>}[]>([])
  const [columnsLoading, setColumnsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
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
    setSelected(new Set())
    setSelectAll(false)
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

  const header = useMemo(()=>columns, [columns])

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    // Header checkbox kaldırıldı; fonksiyon tutuldu ancak kullanılmıyor
    if (selectAll) {
      setSelected(new Set())
      setSelectAll(false)
    } else {
      const all = new Set(rows.map(r => r.id))
      setSelected(all)
      setSelectAll(true)
    }
  }

  const deleteSelected = async () => {
    if (!selected.size) return
    setLoading(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/rows/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Silme hatası')
      toast.success(`${data.count} satır silindi`)
      await applyFilters()
      onDeleted?.()
    } catch (e:any) {
      toast.error(e.message || 'Silme hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Silme işlemleri</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>Kapat</Button>
            </div>
          </div>

          <div className="p-4 overflow-auto max-h-[32vh]">
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
            <Button variant="outline" onClick={()=>{ setTerms({}); setFrom(''); setTo(''); setPage(1); setTotal(0); setRows([]); setSelected(new Set()); setSelectAll(false) }}>Temizle</Button>
            <Button className='bg-red-500 hover:bg-red-600' variant="default" onClick={deleteSelected} disabled={!selected.size || loading}>
              {selected.size ? `Seçiliyi Sil (${selected.size})` : 'Seçiliyi Sil'}
            </Button>
            <Button onClick={()=>applyFilters(1)} disabled={loading}>{loading ? 'Getiriliyor...' : 'Listele'}</Button>
          </div>

          <div className="p-0 overflow-auto max-h-[42vh]">
            <div className="min-w-[1000px]">
              {loading && (
                <div className="p-6 flex items-center justify-center">
                  <Spinner className="h-8 w-8" />
                  <span className="ml-3 text-sm text-gray-600">Veriler yükleniyor...</span>
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
                        <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleRow(r.id)} />
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


