'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Power, Settings } from 'lucide-react'
import AdminSettingsModal from './AdminSettingsModal'
import UploadSection from './upload-section'
import RowsTable from './rows-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FilterModal from './FilterModal'
import DeleteModal from './DeleteModal'

export default function DashboardClient({ searchParams, session }: {
  searchParams?: Record<string, string | string[] | undefined>
  session: any
}) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const handleUploadSuccess = () => setRefreshKey((k) => k + 1)
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image src="/logoipos.svg" alt="IPOS" width={160} height={26} priority />
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Ayarlar"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                onClick={()=>setAdminOpen(true)}
              >
                <Settings className="w-4 h-4 text-gray-700" />
              </button>
              <button
                aria-label="Çıkış"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white"
                title="Çıkış Yap"
                onClick={handleLogout}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-6 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={()=>setFilterOpen(true)}>Filtreleme işlemleri</Button>
              <Button variant="outline" onClick={()=>setDeleteOpen(true)}>Silme işlemleri</Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <UploadSection onUpload={handleUploadSuccess} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-0 overflow-auto">
          <RowsTable
            query={{
              q: (searchParams?.q as string) || undefined,
              gtip: (searchParams?.gtip as string) || undefined,
              country: (searchParams?.country as string) || undefined,
              from: (searchParams?.from as string) || undefined,
              to: (searchParams?.to as string) || undefined,
            }}
            refreshKey={refreshKey}
          />
        </div>

        {filterOpen && (<FilterModal onClose={()=>setFilterOpen(false)} />)}
        {deleteOpen && (<DeleteModal onClose={()=>setDeleteOpen(false)} onDeleted={()=>setRefreshKey(k=>k+1)} />)}
        {adminOpen && (<AdminSettingsModal onClose={()=>setAdminOpen(false)} />)}
      </main>
    </div>
  )
}
