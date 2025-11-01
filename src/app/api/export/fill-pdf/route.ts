import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

type Mapping = Record<string, { page: number; x: number; y: number; size?: number }>

function normalizeKey(k: string) {
  return k
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Kolonları normalize ederek key->value map'i döndür
function buildRowLookup(row: Record<string, any>, columns: string[]) {
  const map: Record<string, any> = {}
  for (const c of columns) {
    const key = normalizeKey(c)
    map[key] = row[c]
  }
  return map
}

async function loadMapping(): Promise<Mapping> {
  const mappingPath = path.join(process.cwd(), 'public', 'example', 'mapping.json')
  try {
    const buf = await fs.readFile(mappingPath, 'utf-8')
    return JSON.parse(buf)
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rows = body.rows as any[]
    const columns = body.columns as string[]
    const template = String(body.template || 'example/Pdf-Template.pdf').replace(/^\/+/, '')
    const mode = String(body.mode || 'auto')

    if (!rows?.length || !columns?.length) {
      return NextResponse.json({ message: 'Veri bulunamadı' }, { status: 400 })
    }

    const templatePath = path.join(process.cwd(), 'public', template)
    const pdfBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: false })

    // Dönüşüm
    const lookups = rows.map((r) => buildRowLookup(r, columns))

    // Plan A: AcroForm dene
    const form = (pdfDoc as any).getForm?.()
    const hasAcro = !!form && form.getFields && form.getFields().length > 0

    if (hasAcro && mode !== 'overlay') {
      for (let i = 0; i < lookups.length; i++) {
        const data = lookups[i]
        if (i > 0) {
          const [tpl] = await pdfDoc.copyPages(pdfDoc, [0])
          pdfDoc.addPage(tpl)
        }
        const fields = form.getFields()
        for (const f of fields) {
          const name = f.getName()
          const norm = normalizeKey(name)
          const direct = data[norm]
          const value = direct ?? data[norm.replace(/\./g, '_')] ?? data[norm.replace(/_/g, '')]
          if (value != null) {
            try {
              const tf = form.getTextField(name)
              tf?.setText(String(value))
            } catch {}
          }
        }
      }
      form?.flatten()
    } else {
      // Plan B: overlay
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const mapping = await loadMapping()
      for (let i = 0; i < lookups.length; i++) {
        const data = lookups[i]
        if (i > 0) {
          const [tpl] = await pdfDoc.copyPages(pdfDoc, [0])
          pdfDoc.addPage(tpl)
        }
        for (const key of Object.keys(mapping)) {
          const m = (mapping as Mapping)[key]
          const page = pdfDoc.getPage(m.page || 0)
          const norm = normalizeKey(key)
          const val = data[norm] ?? data[norm.replace(/\./g, '_')] ?? data[norm.replace(/_/g, '')]
          if (val == null) continue
          page.drawText(String(val), {
            x: m.x,
            y: m.y,
            size: m.size || 11,
            font,
          })
        }
      }
    }

    const out = await pdfDoc.save()
    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fatura.pdf"',
      },
    })
  } catch (e) {
    console.error('fill-pdf error:', e)
    return NextResponse.json({ message: 'PDF oluşturulamadı' }, { status: 500 })
  }
}


