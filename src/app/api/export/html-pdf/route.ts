import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const headers: string[] = body.headers || []
    const rows: string[][] = body.rows || []
    if (!headers.length || !rows.length) {
      return NextResponse.json({ message: 'Veri bulunamadı' }, { status: 400 })
    }
    const pdf = await renderTablePdf(headers, rows)
    const ab = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength)
    return new Response(ab as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filtre-sonucu.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('html-pdf error:', e)
    return NextResponse.json({ message: 'PDF oluşturulamadı' }, { status: 500 })
  }
}

async function renderTablePdf(headers: string[], rows: string[][]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  let page = pdfDoc.addPage([595.28, 841.89]) // A4 portrait in points
  const margin = { top: 56, right: 34, bottom: 56, left: 34 }
  const usableWidth = page.getWidth() - margin.left - margin.right
  const usableHeight = page.getHeight() - margin.top - margin.bottom
  const rowHeight = 16
  const headerHeight = 22

  const colCount = headers.length
  const colWidth = usableWidth / Math.max(1, colCount)

  let cursorY = page.getHeight() - margin.top

  // Title
  page.drawText(toAnsi('Filtrelenen Kayıtlar'), { x: margin.left, y: cursorY, size: 14, font: fontBold })
  cursorY -= 24

  // Header background
  const headerY = cursorY - headerHeight + 4
  for (let i = 0; i < colCount; i++) {
    page.drawRectangle({ x: margin.left + i * colWidth, y: headerY, width: colWidth, height: headerHeight, color: undefined, borderColor: undefined, borderWidth: 0 })
    const text = truncate(toAnsi(headers[i] ?? ''), Math.floor(colWidth / 6))
    page.drawText(text, { x: margin.left + i * colWidth + 2, y: cursorY - 14, size: 10, font: fontBold })
  }
  cursorY -= headerHeight

  // Rows
  for (const r of rows) {
    if (cursorY - rowHeight < margin.bottom) {
      // new page
      const p = pdfDoc.addPage([595.28, 841.89])
      page = p
      page.drawText(toAnsi('Devam'), { x: margin.left, y: page.getHeight() - margin.top, size: 12, font: fontBold })
      cursorY = page.getHeight() - margin.top - 24
    }
    for (let i = 0; i < colCount; i++) {
      const val = r[i] == null ? '' : String(r[i])
      const txt = truncate(toAnsi(val), Math.floor(colWidth / 6))
      page.drawText(txt, { x: margin.left + i * colWidth + 2, y: cursorY - 12, size: 10, font })
    }
    cursorY -= rowHeight
  }

  const out = await pdfDoc.save()
  return out
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  if (max <= 3) return s.slice(0, max)
  return s.slice(0, max - 3) + '...'
}

function toAnsi(input: string): string {
  // PDF StandardFonts (WinAnsi) Türkçe bazı karakterleri desteklemez; yakın ASCII ile değiştir
  return input
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
}


