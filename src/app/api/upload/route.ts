import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { parseExcel, hashBuffer, normalizeRowKeys } from '@/lib/excel/parse'

const prisma = new PrismaClient()
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ message: 'Dosya bulunamadı' }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const fileHash = hashBuffer(arrayBuffer)
    const existing = await prisma.upload.findUnique({ where: { fileHash } })
    if (existing) {
      return NextResponse.json({ success: true, uploadId: existing.id, skipped: true })
    }
    const { rows } = parseExcel(arrayBuffer)
    const normalizedRows = rows.map((r) => normalizeRowKeys(r))
    const columnsOrder = rows[0] ? Object.keys(normalizeRowKeys(rows[0])).filter(h=>!!h && !/^empty(\s|\d)*$/i.test(h.trim())) : [];
    const upload = await prisma.upload.create({
      data: { filename: file.name, fileHash, rowCount: rows.length, columnsOrder },
    })
    const mapped = normalizedRows.map((r, idx) => ({
      uploadId: upload.id,
      rowIndex: idx,
      columns: r,
      raw: r
    }))
    await prisma.uploadRow.createMany({ data: mapped })
    return NextResponse.json({ success: true, uploadId: upload.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Yükleme hatası' }, { status: 500 })
  }
}


