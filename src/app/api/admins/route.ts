import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) return NextResponse.json({ message: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return NextResponse.json({ message: 'Kullanıcı zaten var' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { username, password: hashed, role: 'admin' } })
    return NextResponse.json({ id: user.id, username: user.username, role: user.role })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Kayıt hatası' }, { status: 500 })
  }
}


