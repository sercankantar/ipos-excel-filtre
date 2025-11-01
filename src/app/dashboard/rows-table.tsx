"use client"
import { useEffect, useState } from 'react'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

type Query = Record<string, string | undefined>

type APIResponse = {
  rows: { id: string; rowIndex: number; columns: Record<string, unknown> }[]
  columns: string[]
  total: number
  page: number
  pageSize: number
}

export default function RowsTable({ query, refreshKey = 0 }: { query: Query; refreshKey?: number }) {
  const [rows, setRows] = useState<APIResponse['rows']>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    const ctrl = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v) })
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const res = await fetch(`/api/rows?${params.toString()}`, { signal: ctrl.signal })
        const data: APIResponse = await res.json()
        if (!res.ok) throw new Error((data as any)?.message || 'Hata')
        setRows(data.rows || [])
        setColumns(data.columns || [])
        setTotal(data.total || 0)
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => ctrl.abort()
  // refreshKey değiştiğinde fetch et
  }, [JSON.stringify(query), page, refreshKey])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="w-full">
      {loading && (
        <div className="p-6 flex items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-3 text-sm text-gray-600">Veriler yükleniyor...</span>
        </div>
      )}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}
      <div className="min-w-[1000px] overflow-auto">
        <Table>
          <THead>
            <TR>
              {columns.filter(h=>!!h && !/^empty(\s|\d)*$/i.test(h.trim())).map(h => (
                <TH key={h}>{h}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                {columns.filter(h=>!!h && !/^empty(\s|\d)*$/i.test(h.trim())).map((c) => (
                  <TD key={c}>{r.columns?.[c] == null ? "" : String(r.columns[c])}</TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-3">
        <div className="text-sm text-gray-600">Toplam: {total} • Sayfa {page}/{totalPages}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Geri
          </Button>
          <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            İleri
          </Button>
        </div>
      </div>
    </div>
  )
}


