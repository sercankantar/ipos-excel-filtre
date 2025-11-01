import { cookies } from 'next/headers'

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  
  if (!session) {
    return null
  }
  
  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    return null
  }
  
  return session
}

