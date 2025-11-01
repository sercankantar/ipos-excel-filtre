import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 })
    }
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Admin delete error:', e)
    const message = (e as any)?.message || 'Silme hatası'
    return NextResponse.json({ message }, { status: 500 })
  }
}


