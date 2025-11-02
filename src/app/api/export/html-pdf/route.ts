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
  
  const margin = { top: 60, right: 40, bottom: 40, left: 40 }
  const rowHeight = 22
  const headerHeight = 25
  const tableLineWidth = 0.8

  const colCount = headers.length
  const usableWidth = page.getWidth() - margin.left - margin.right
  const colWidth = usableWidth / Math.max(1, colCount)

  let cursorY = page.getHeight() - margin.top

  // Logo area (sol üstte)
  page.drawText('IPOS', { x: margin.left, y: cursorY - 8, size: 18, font: fontBold })
  page.drawText('Steel', { x: margin.left + 48, y: cursorY - 8, size: 18, font: fontBold })
  page.drawText('CABLE TRAY & PROFILES', { x: margin.left, y: cursorY - 22, size: 8, font })

  // Title (sağ üstte)
  const titleWidth = fontBold.widthOfTextAtSize('Filtrelenen Kayitlar', 16)
  page.drawText(toAscii('Filtrelenen Kayitlar'), { 
    x: page.getWidth() - margin.right - titleWidth, 
    y: cursorY - 8, 
    size: 16, 
    font: fontBold 
  })
  cursorY -= 50

  // Table borders (outer rectangle)
  const tableTop = cursorY
  const tableBottom = cursorY - headerHeight - (rows.length * rowHeight)
  
  // Top border
  page.drawLine({ 
    start: { x: margin.left, y: cursorY }, 
    end: { x: margin.left + usableWidth, y: cursorY }, 
    thickness: tableLineWidth 
  })
  
  // Bottom border
  page.drawLine({ 
    start: { x: margin.left, y: tableBottom }, 
    end: { x: margin.left + usableWidth, y: tableBottom }, 
    thickness: tableLineWidth 
  })
  
  // Left border
  page.drawLine({ 
    start: { x: margin.left, y: cursorY }, 
    end: { x: margin.left, y: tableBottom }, 
    thickness: tableLineWidth 
  })
  
  // Right border
  page.drawLine({ 
    start: { x: margin.left + usableWidth, y: cursorY }, 
    end: { x: margin.left + usableWidth, y: tableBottom }, 
    thickness: tableLineWidth 
  })

  // Header row border
  const headerBorderY = cursorY - headerHeight
  page.drawLine({ 
    start: { x: margin.left, y: headerBorderY }, 
    end: { x: margin.left + usableWidth, y: headerBorderY }, 
    thickness: tableLineWidth 
  })

  // Headers
  for (let i = 0; i < colCount; i++) {
    const x = margin.left + i * colWidth
    // Vertical cell borders
    if (i > 0) {
      page.drawLine({ 
        start: { x, y: cursorY }, 
        end: { x, y: headerBorderY }, 
        thickness: 0.6 
      })
    }
    const text = truncate(toAscii(headers[i] ?? ''), Math.floor(colWidth / 7))
    // Center-aligned header text
    const textWidth = fontBold.widthOfTextAtSize(text, 10)
    page.drawText(text, { 
      x: x + (colWidth - textWidth) / 2, 
      y: cursorY - headerHeight + 16, 
      size: 10, 
      font: fontBold 
    })
  }
  cursorY -= headerHeight

  // Rows
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx]
    if (cursorY - rowHeight < margin.bottom) {
      const p = pdfDoc.addPage([595.28, 841.89])
      page = p
      cursorY = p.getHeight() - margin.top
    }
    
    const rowTop = cursorY
    const rowBottom = cursorY - rowHeight
    
    // Horizontal row border
    page.drawLine({ 
      start: { x: margin.left, y: rowBottom }, 
      end: { x: margin.left + usableWidth, y: rowBottom }, 
      thickness: 0.6 
    })
    
    for (let i = 0; i < colCount; i++) {
      const x = margin.left + i * colWidth
      // Vertical cell borders
      if (i > 0) {
        page.drawLine({ 
          start: { x, y: rowTop }, 
          end: { x, y: rowBottom }, 
          thickness: 0.6 
        })
      }
      const val = r[i] == null ? '' : String(r[i])
      const txt = truncate(toAscii(val), Math.floor(colWidth / 7))
      
      // Smart alignment based on content
      const alignment = getAlignment(val, i)
      let textX = x + 4
      if (alignment === 'right') {
        const textWidth = font.widthOfTextAtSize(txt, 9)
        textX = x + colWidth - textWidth - 4
      } else if (alignment === 'center') {
        const textWidth = font.widthOfTextAtSize(txt, 9)
        textX = x + (colWidth - textWidth) / 2
      }
      
      page.drawText(txt, { x: textX, y: cursorY - rowHeight + 14, size: 9, font })
    }
    cursorY -= rowHeight
  }

  const out = await pdfDoc.save()
  return out
}

function getAlignment(value: string, colIndex: number): 'left' | 'center' | 'right' {
  // Numeric değerler sağa
  if (/^\d+([.,]\d+)?$/.test(value.trim())) return 'right'
  // Başlık satırı veya özel durumlar
  if (colIndex === 0) return 'left'
  return 'left'
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  if (max <= 3) return s.slice(0, max)
  return s.slice(0, max - 3) + '...'
}

function toAscii(input: string): string {
  // WinAnsi Türkçe karakterleri desteklemez; ASCII karşılıklar
  return input
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
}



