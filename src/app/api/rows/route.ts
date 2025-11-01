import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('uploadId')
    const page = Number(searchParams.get('page') || '1')
    const pageSize = Math.min(2000, Number(searchParams.get('pageSize') || '100'))
    const skip = Math.max(0, (page - 1) * pageSize)

    const filtersRaw = searchParams.get('filters')
    let filters: undefined | { terms?: Record<string, string>, from?: string, to?: string, dateKey?: string }
    if (filtersRaw) {
      try { filters = JSON.parse(filtersRaw) } catch {}
    }

    const where: any = {}
    if (uploadId) where.uploadId = uploadId

    // Header: ilgili upload’ın columnsOrder alanı
    let columns: string[] = []
    if (uploadId) {
      const up = await prisma.upload.findUnique({ where: { id: uploadId }, select: { columnsOrder: true } })
      if (up?.columnsOrder) columns = up.columnsOrder.filter((h: any) => !!h && !/^empty(\s|\d)*$/i.test(String(h).trim()))
    }
    if (!columns.length) {
      const last = await prisma.upload.findFirst({ orderBy: { createdAt: 'desc' }, select: { columnsOrder: true } })
      if (last?.columnsOrder) columns = last.columnsOrder.filter((h: any) => !!h && !/^empty(\s|\d)*$/i.test(String(h).trim()))
    }

    if (!filters) {
      const [total, rows] = await Promise.all([
        prisma.uploadRow.count({ where }),
        prisma.uploadRow.findMany({
          where, orderBy: { rowIndex: 'asc' }, skip, take: pageSize,
          select: { id: true, uploadId: true, rowIndex: true, columns: true, raw: true, createdAt: true }
        })
      ])
      return NextResponse.json({ rows, total, page, pageSize, columns })
    }

    // Filters var: daha fazla satır çek, JS ile filtrele
    const baseRows = await prisma.uploadRow.findMany({
      where, orderBy: { rowIndex: 'asc' }, take: 5000,
      select: { id: true, uploadId: true, rowIndex: true, columns: true, raw: true, createdAt: true }
    })

    const terms = filters.terms || {}
    const dateKey = filters.dateKey
    const from = filters.from ? new Date(filters.from) : undefined
    const to = filters.to ? new Date(filters.to) : undefined

    const filtered = baseRows.filter(r => {
      // text terms includes (case-insensitive)
      for (const [k, v] of Object.entries(terms)) {
        if (!v) continue
        const cell = (r.columns as any)?.[k]
        const val = cell == null ? '' : String(cell)
        if (!val.toLowerCase().includes(String(v).toLowerCase())) return false
      }
      if (dateKey && (from || to)) {
        const dRaw = (r.columns as any)?.[dateKey]
        const d = dRaw ? new Date(dRaw) : undefined
        if (from && (!d || d < from)) return false
        if (to && (!d || d > to)) return false
      }
      return true
    })

    const total = filtered.length
    const rows = filtered.slice(skip, skip + pageSize)
    return NextResponse.json({ rows, total, page, pageSize, columns })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Sorgu hatası' }, { status: 500 })
  }
}


