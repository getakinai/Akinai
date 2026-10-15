import app from '@adonisjs/core/services/app'
import PDFDocument from 'pdfkit'
import type {
  OrderDocumentData,
  OrderDocumentLine,
  OrderDocumentRow,
} from '#documents/order_document_data'

type Doc = PDFKit.PDFDocument

const MARGIN = 48
const FONT = 'Inter'
const FONT_BOLD = 'InterSemiBold'
const INK = '#111111'
const MUTED = '#6b6b6b'
const LINE = '#dcdcdc'
const STAMP = '#1f6f43'
const STAMP_DANGER = '#b42318'

/**
 * Renders an order document (invoice, receipt, packing slip) as an A4 PDF.
 * Text is drawn as text, never parsed as markup.
 */
export function renderOrderPdf(data: OrderDocumentData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    font: app.makePath('resources/fonts/Inter-Regular.ttf'),
    info: { Title: data.title, Author: data.store.name },
  })
  doc.registerFont(FONT, app.makePath('resources/fonts/Inter-Regular.ttf'))
  doc.registerFont(FONT_BOLD, app.makePath('resources/fonts/Inter-SemiBold.ttf'))

  const chunks: Buffer[] = []
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  header(doc, data)
  parties(doc, data)
  itemsTable(doc, data)
  totals(doc, data)
  sections(doc, data)
  footer(doc, data)
  doc.end()
  return done
}

function contentWidth(doc: Doc) {
  return doc.page.width - MARGIN * 2
}

function pageBottom(doc: Doc) {
  return doc.page.height - MARGIN
}

/** Starts a new page when `height` doesn't fit below the cursor. */
function ensureSpace(doc: Doc, height: number): boolean {
  if (doc.y + height <= pageBottom(doc)) return false
  doc.addPage()
  return true
}

function rule(doc: Doc, y = doc.y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .lineWidth(0.5)
    .strokeColor(LINE)
    .stroke()
}

function header(doc: Doc, data: OrderDocumentData) {
  const width = contentWidth(doc)
  const leftWidth = width * 0.55
  const rightX = MARGIN + leftWidth + 16
  const rightWidth = width - leftWidth - 16
  const top = doc.y

  doc.font(FONT_BOLD).fontSize(16).fillColor(INK).text(data.store.name, MARGIN, top, {
    width: leftWidth,
  })
  doc.moveDown(0.3).font(FONT).fontSize(9).fillColor(MUTED)
  for (const line of data.store.lines) doc.text(line, { width: leftWidth })
  const leftBottom = doc.y

  doc.font(FONT_BOLD).fontSize(20).fillColor(INK).text(data.title, rightX, top, {
    width: rightWidth,
    align: 'right',
  })
  if (data.stamp) {
    const danger = data.stamp === 'Cancelled' || data.stamp === 'Voided'
    doc
      .moveDown(0.2)
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(danger ? STAMP_DANGER : STAMP)
      .text(data.stamp.toUpperCase(), rightX, doc.y, { width: rightWidth, align: 'right' })
  }
  doc.moveDown(0.6)
  metaRows(doc, data.meta, rightX, rightWidth)

  doc.y = Math.max(leftBottom, doc.y) + 20
  rule(doc)
  doc.y += 16
}

function metaRows(doc: Doc, rows: OrderDocumentRow[], x: number, width: number) {
  for (const row of rows) {
    const y = doc.y
    doc
      .font(FONT)
      .fontSize(9)
      .fillColor(MUTED)
      .text(row.label, x, y, { width: width * 0.3 })
    const labelBottom = doc.y
    doc
      .font(FONT)
      .fontSize(9)
      .fillColor(INK)
      .text(row.value, x + width * 0.3, y, { width: width * 0.7, align: 'right' })
    doc.y = Math.max(labelBottom, doc.y) + 2
  }
}

function parties(doc: Doc, data: OrderDocumentData) {
  if (data.parties.length === 0) return
  const width = contentWidth(doc)
  const columnWidth = (width - 24) / 2
  const top = doc.y
  let bottom = top
  data.parties.forEach((party, index) => {
    const x = MARGIN + index * (columnWidth + 24)
    doc.font(FONT_BOLD).fontSize(9).fillColor(MUTED).text(party.heading.toUpperCase(), x, top, {
      width: columnWidth,
      characterSpacing: 0.5,
    })
    doc.moveDown(0.3).font(FONT).fontSize(10).fillColor(INK)
    for (const line of party.lines) doc.text(line, x, doc.y, { width: columnWidth })
    bottom = Math.max(bottom, doc.y)
  })
  doc.y = bottom + 20
}

type Column = { label: string; width: number; align: 'left' | 'right' | 'center' }

function columnsFor(doc: Doc, data: OrderDocumentData): Column[] {
  const width = contentWidth(doc)
  if (data.showPrices) {
    return [
      { label: 'Item', width: width - 50 - 90 - 90, align: 'left' },
      { label: 'Qty', width: 50, align: 'right' },
      { label: 'Price', width: 90, align: 'right' },
      { label: 'Amount', width: 90, align: 'right' },
    ]
  }
  return [
    { label: 'Item', width: width - 60 - 60, align: 'left' },
    { label: 'Qty', width: 60, align: 'right' },
    { label: 'Packed', width: 60, align: 'center' },
  ]
}

function tableHeader(doc: Doc, columns: Column[]) {
  const y = doc.y
  let x = MARGIN
  doc.font(FONT_BOLD).fontSize(9).fillColor(MUTED)
  for (const column of columns) {
    doc.text(column.label.toUpperCase(), x, y, {
      width: column.width,
      align: column.align,
      characterSpacing: 0.5,
    })
    x += column.width
  }
  doc.y = y + 16
  rule(doc)
  doc.y += 8
}

function rowHeight(doc: Doc, line: OrderDocumentLine, itemWidth: number) {
  doc.font(FONT).fontSize(10)
  let height = doc.heightOfString(line.title, { width: itemWidth })
  if (line.detail) {
    doc.fontSize(8.5)
    height += 2 + doc.heightOfString(line.detail, { width: itemWidth })
  }
  return height + 12
}

function itemsTable(doc: Doc, data: OrderDocumentData) {
  const columns = columnsFor(doc, data)
  ensureSpace(doc, 60)
  tableHeader(doc, columns)

  if (data.lines.length === 0) {
    doc.font(FONT).fontSize(10).fillColor(MUTED).text('Nothing left to ship.', MARGIN, doc.y)
    doc.moveDown(1)
    return
  }

  for (const line of data.lines) {
    const height = rowHeight(doc, line, columns[0].width - 8)
    if (ensureSpace(doc, height)) tableHeader(doc, columns)
    const y = doc.y

    doc
      .font(FONT)
      .fontSize(10)
      .fillColor(INK)
      .text(line.title, MARGIN, y, { width: columns[0].width - 8 })
    if (line.detail) {
      doc
        .moveDown(0.15)
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(line.detail, MARGIN, doc.y, { width: columns[0].width - 8 })
    }

    const cells = data.showPrices
      ? [String(line.quantity), line.unitPrice ?? '', line.amount ?? '']
      : [String(line.quantity)]
    let x = MARGIN + columns[0].width
    cells.forEach((cell, index) => {
      const column = columns[index + 1]
      doc
        .font(FONT)
        .fontSize(10)
        .fillColor(INK)
        .text(cell, x, y, { width: column.width, align: column.align })
      x += column.width
    })
    if (!data.showPrices) {
      const box = columns[columns.length - 1]
      doc
        .rect(x + box.width / 2 - 5, y + 1, 10, 10)
        .lineWidth(0.75)
        .strokeColor(MUTED)
        .stroke()
    }

    doc.y = y + height - 6
    rule(doc)
    doc.y += 6
  }
}

function totals(doc: Doc, data: OrderDocumentData) {
  if (data.totals.length === 0) return
  const width = contentWidth(doc)
  const blockWidth = 240
  const x = MARGIN + width - blockWidth
  doc.y += 4
  for (const total of data.totals) {
    ensureSpace(doc, 20)
    const y = doc.y
    const font = total.strong ? FONT_BOLD : FONT
    doc
      .font(font)
      .fontSize(total.strong ? 11 : 10)
      .fillColor(total.strong ? INK : MUTED)
    doc.text(total.label, x, y, { width: blockWidth - 100 })
    const labelBottom = doc.y
    doc
      .font(font)
      .fillColor(INK)
      .text(total.amount, x + blockWidth - 100, y, {
        width: 100,
        align: 'right',
      })
    doc.y = Math.max(labelBottom, doc.y) + 4
  }
  doc.y += 12
}

function sections(doc: Doc, data: OrderDocumentData) {
  const width = contentWidth(doc)
  for (const section of data.sections) {
    ensureSpace(doc, 40 + section.rows.length * 14)
    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor(MUTED)
      .text(section.heading.toUpperCase(), MARGIN, doc.y, { width, characterSpacing: 0.5 })
    doc.moveDown(0.3)
    for (const row of section.rows) {
      const y = doc.y
      doc.font(FONT).fontSize(10).fillColor(MUTED).text(row.label, MARGIN, y, { width: 160 })
      const labelBottom = doc.y
      doc.fillColor(INK).text(row.value, MARGIN + 170, y, { width: width - 170 })
      doc.y = Math.max(labelBottom, doc.y) + 2
    }
    if (section.note) {
      doc.moveDown(0.3).fontSize(9).fillColor(MUTED).text(section.note, MARGIN, doc.y, { width })
    }
    doc.y += 14
  }
}

function footer(doc: Doc, data: OrderDocumentData) {
  ensureSpace(doc, 30)
  doc.y += 6
  rule(doc)
  doc.y += 10
  doc
    .font(FONT)
    .fontSize(9)
    .fillColor(MUTED)
    .text(data.footer, MARGIN, doc.y, { width: contentWidth(doc), align: 'center' })
}
