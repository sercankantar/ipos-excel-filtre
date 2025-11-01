import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const headers: string[] = body.headers || []
    const rows: string[][] = body.rows || []
    if (!headers.length || !rows.length) {
      return NextResponse.json({ message: 'Veri bulunamadı' }, { status: 400 })
    }

    // SVG logoyu inline et
    const logoUrl = new URL('/logoipos.svg', req.nextUrl.origin).toString()
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Filtre Sonucu</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111827; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .logo { height: 36px; }
    .title { font-size: 18px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; text-align: left; vertical-align: top; }
    thead th { background: #f3f4f6; font-weight: 600; }
    tbody tr:nth-child(even) { background: #fafafa; }
  </style>
  <link rel="preload" as="image" href="${logoUrl}" />
  <link rel="icon" href="data:," />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; img-src 'self' data: blob: ${req.nextUrl.origin}; style-src 'unsafe-inline' 'self';" />
  </head>
<body>
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="IPOS" />
    <div class="title">Filtrelenen Kayıtlar</div>
  </div>
  <table>
    <thead>
      <tr>
        ${headers.map((h)=>`<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map((r)=>`<tr>${r.map((c)=>`<td>${escapeHtml(String(c ?? ''))}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`

    const pdf = await renderHtmlToPdf(html)
    return new NextResponse(pdf, {
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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  // puppeteer runtime import (dinamik)
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  } as any)
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' },
    })
    return Buffer.from(buffer)
  } finally {
    await browser.close()
  }
}


