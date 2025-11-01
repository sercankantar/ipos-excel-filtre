'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

export default function AdminSettingsModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<{id:string; username:string; role:string; createdAt:string}[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const load = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admins')
      const data = await res.json()
      setUsers(data.users || [])
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const addAdmin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admins', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data?.message || 'Kayıt başarısız')
      }
      setUsername(''); setPassword('')
      await load()
      toast.success('Admin eklendi')
    } finally { setLoading(false) }
  }

  const remove = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data?.message || 'Silme başarısız')
      }
      await load()
      toast.success('Admin silindi')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Ayarlar • Admin Yönetimi</h3>
            <Button variant="outline" onClick={onClose}>Kapat</Button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder="Kullanıcı adı" value={username} onChange={(e)=>setUsername(e.target.value)} disabled={loading} />
              <input type="password" className="px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder="Şifre" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={loading} />
              <Button onClick={addAdmin} disabled={loading || !username || !password}>{loading ? 'Ekleniyor...' : 'Admin Ekle'}</Button>
            </div>
          </div>
          <div className="p-0 overflow-auto max-h-[60vh]">
            <div className="min-w-[600px]">
              {loadingUsers && (
                <div className="p-6 flex items-center justify-center">
                  <Spinner className="h-8 w-8" />
                  <span className="ml-3 text-sm text-gray-600">Yönetici listesi yükleniyor...</span>
                </div>
              )}
              <Table>
                <THead>
                  <TR>
                    <TH>Kullanıcı Adı</TH>
                    <TH>Rol</TH>
                    <TH>Oluşturma</TH>
                    <TH></TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map(u => (
                    <TR key={u.id}>
                      <TD>{u.username}</TD>
                      <TD>{u.role}</TD>
                      <TD>{new Date(u.createdAt).toLocaleString()}</TD>
                      <TD>
                        <Button variant="outline" onClick={()=>remove(u.id)} disabled={loading}>Sil</Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


