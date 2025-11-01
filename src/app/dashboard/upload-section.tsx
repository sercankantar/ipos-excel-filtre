'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function UploadSection({ onUpload }: { onUpload?: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<{uploadId: string}|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>()

  const onDrop = useCallback(async (file: File) => {
    setError(undefined)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Yükleme hatası')
      setResult(data)
      toast.success('Dosyanız başarıyla yüklendi')
      onUpload?.() // Başarılı sonuçtan hemen sonra tetikle
    } catch (e:any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [onUpload])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onDrop(f)
  }, [onDrop])

  const border = useMemo(() => dragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300', [dragging])
  const disabledStyle = loading ? 'pointer-events-none opacity-50' : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excel Yükle</CardTitle>
      </CardHeader>
      <CardContent>
        <label
          onDragOver={(e)=>{e.preventDefault(); setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={(e)=>{e.preventDefault(); setDragging(false); const f=e.dataTransfer.files?.[0]; if (f && !loading) onDrop(f)}}
          className={`w-full flex flex-col items-center justify-center gap-2 py-10 rounded-lg border-2 ${border} cursor-pointer transition ${disabledStyle}`}
        >
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onInputChange} disabled={loading} />
          <span className="text-gray-700 font-medium">Dosyayı sürükleyip bırakın veya tıklayın</span>
          <span className="text-sm text-gray-500">.xlsx, .xls</span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={()=>document.querySelector<HTMLInputElement>('input[type=file]')?.click()} disabled={loading}>Dosya Seç</Button>
          {loading && <span className="text-sm text-gray-600">Yükleniyor...</span>}
        </div>

        {result && (
          <div className="mt-4 text-sm text-gray-700">
            <p>Yükleme ID: <span className="font-mono">{result.uploadId}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


