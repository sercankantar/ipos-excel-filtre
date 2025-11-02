import { NextRequest, NextResponse } from 'next/server'

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
    const html = buildHtml(req.nextUrl.origin, headers, rows)
    const pdf = await renderHtmlToPdf(html)
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

function buildHtml(origin: string, headers: string[], rows: string[][]): string {
  const logoUrl = new URL('/logoipos.svg', origin).toString()
  return `<!DOCTYPE html>
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
</head>
<body>
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="IPOS" />
    <div class="title">Filtrelenen Kayıtlar</div>
  </div>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c ?? ''))}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function renderHtmlToPdf(html: string): Promise<Uint8Array> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  let browser: any
  
  if (isProduction) {
    // Vercel production ortamında @sparticuz/chromium kullan
    const chromium = await import('@sparticuz/chromium')
    const puppeteer = await import('puppeteer-core')
    const executablePath = await chromium.default.executablePath()
    browser = await puppeteer.default.launch({
      executablePath,
      args: chromium.default.args,
      headless: chromium.default.headless,
      defaultViewport: chromium.default.defaultViewport,
    } as any)
  } else {
    // Lokal geliştirme ortamında tam puppeteer kullan
    const puppeteer = await import('puppeteer')
    const path = await puppeteer.default.executablePath()
    browser = await puppeteer.default.launch({
      executablePath: path,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
      defaultViewport: { width: 1920, height: 1080 },
    } as any)
  }
  
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' },
    })
    return new Uint8Array(buffer)
  } finally {
    await browser.close()
  }
}



