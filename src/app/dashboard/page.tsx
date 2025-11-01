import { redirect } from 'next/navigation'
import { getSession } from '@/lib/utils/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const session = await getSession()
  if (!session) { redirect('/login') }
  return <DashboardClient searchParams={searchParams} session={session} />
}

