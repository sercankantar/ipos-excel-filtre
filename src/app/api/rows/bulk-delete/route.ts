import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ message: 'Silinecek satır bulunamadı' }, { status: 400 })
    }
    const result = await prisma.uploadRow.deleteMany({ where: { id: { in: ids as string[] } } })
    return NextResponse.json({ success: true, count: result.count })
  } catch (e) {
    console.error('Rows bulk delete error:', e)
    return NextResponse.json({ message: 'Silme hatası' }, { status: 500 })
  }
}


