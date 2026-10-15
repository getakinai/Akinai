import app from '@adonisjs/core/services/app'
import PDFDocument from 'pdfkit'

type Doc = PDFKit.PDFDocument

export type AnalyticsReportPdfData = {
  storeName: string
  title: string
  description: string
  rangeText: string
  generatedText: string
  summary: { label: string; value: string; detail: string | null }[]
  notes: string[]
  columns: { label: string; align: 'left' | 'right' }[]
  rows: string[][]
}

const MARGIN = 40
const FONT = 'Inter'
const FONT_BOLD = 'InterSemiBold'
const INK = '#111111'
const MUTED = '#6b6b6b'
const LINE = '#dcdcdc'
const PANEL = '#f6f6f7'
const ROW_HEIGHT = 20
const SUMMARY_PER_ROW = 4

/**
 * Renders an analytics report as an A4 PDF: header, summary metrics, notes
 * and the report table (landscape when it has many columns). Text is drawn
 * as text, never parsed as markup.
 */
export function renderAnalyticsReportPdf(data: AnalyticsReportPdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: data.columns.length > 5 ? 'landscape' : 'portrait',
    margin: MARGIN,
    font: app.makePath('resources/fonts/Inter-Regular.ttf'),
    info: { Title: data.title, Author: data.storeName },
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
  summary(doc, data)
  notes(doc, data)
  table(doc, data)
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

function header(doc: Doc, data: AnalyticsReportPdfData) {
  const width = contentWidth(doc)
  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor(MUTED)
    .text(data.storeName.toUpperCase(), MARGIN, doc.y, { width, characterSpacing: 0.6 })
  doc.moveDown(0.4).font(FONT_BOLD).fontSize(20).fillColor(INK).text(data.title, { width })
  doc.moveDown(0.25).font(FONT).fontSize(10).fillColor(MUTED).text(data.description, { width })
  doc.moveDown(0.6).font(FONT_BOLD).fontSize(10).fillColor(INK).text(data.rangeText, { width })
  doc.moveDown(0.15).font(FONT).fontSize(8.5).fillColor(MUTED).text(data.generatedText, { width })
  doc.y += 12
  rule(doc)
  doc.y += 14
}

function summary(doc: Doc, data: AnalyticsReportPdfData) {
  if (data.summary.length === 0) return
  const gap = 10
  const perRow = Math.min(SUMMARY_PER_ROW, data.summary.length)
  const boxWidth = (contentWidth(doc) - gap * (perRow - 1)) / perRow
  const boxHeight = 54

  for (let start = 0; start < data.summary.length; start += perRow) {
    ensureSpace(doc, boxHeight + gap)
    const top = doc.y
    data.summary.slice(start, start + perRow).forEach((metric, index) => {
      const x = MARGIN + index * (boxWidth + gap)
      doc.roundedRect(x, top, boxWidth, boxHeight, 6).fillColor(PANEL).fill()
      doc
        .font(FONT)
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(metric.label, x + 10, top + 9, {
          width: boxWidth - 20,
          lineBreak: false,
          ellipsis: true,
        })
      doc
        .font(FONT_BOLD)
        .fontSize(13)
        .fillColor(INK)
        .text(metric.value, x + 10, top + 22, {
          width: boxWidth - 20,
          lineBreak: false,
          ellipsis: true,
        })
      if (metric.detail) {
        doc
          .font(FONT)
          .fontSize(7.5)
          .fillColor(MUTED)
          .text(metric.detail, x + 10, top + 39, {
            width: boxWidth - 20,
            lineBreak: false,
            ellipsis: true,
          })
      }
    })
    doc.y = top + boxHeight + gap
  }
  doc.y += 6
}

function notes(doc: Doc, data: AnalyticsReportPdfData) {
  if (data.notes.length === 0) return
  const width = contentWidth(doc)
  for (const note of data.notes) {
    ensureSpace(doc, 30)
    doc.font(FONT).fontSize(8.5).fillColor(MUTED).text(note, MARGIN, doc.y, { width })
    doc.moveDown(0.4)
  }
  doc.y += 8
}

function columnWidths(doc: Doc, count: number): number[] {
  const width = contentWidth(doc)
  if (count === 1) return [width]
  const first = Math.min(width * 0.34, Math.max(width / count, 150))
  const rest = (width - first) / (count - 1)
  return [first, ...Array.from({ length: count - 1 }, () => rest)]
}

function tableHeader(doc: Doc, data: AnalyticsReportPdfData, widths: number[]) {
  const y = doc.y
  let x = MARGIN
  doc.font(FONT_BOLD).fontSize(8).fillColor(MUTED)
  data.columns.forEach((column, index) => {
    doc.text(column.label.toUpperCase(), x + 4, y, {
      width: widths[index] - 8,
      align: column.align,
      lineBreak: false,
      ellipsis: true,
      characterSpacing: 0.4,
    })
    x += widths[index]
  })
  doc.y = y + 14
  rule(doc)
  doc.y += 4
}

function table(doc: Doc, data: AnalyticsReportPdfData) {
  if (data.columns.length === 0) return
  const widths = columnWidths(doc, data.columns.length)
  ensureSpace(doc, 60)
  tableHeader(doc, data, widths)

  if (data.rows.length === 0) {
    doc.font(FONT).fontSize(10).fillColor(MUTED).text('No data for this period.', MARGIN, doc.y)
    doc.moveDown(1)
    return
  }

  for (const row of data.rows) {
    if (ensureSpace(doc, ROW_HEIGHT)) tableHeader(doc, data, widths)
    const y = doc.y
    let x = MARGIN
    row.forEach((cell, index) => {
      doc
        .font(index === 0 ? FONT_BOLD : FONT)
        .fontSize(9)
        .fillColor(INK)
        .text(cell, x + 4, y + 4, {
          width: widths[index] - 8,
          align: data.columns[index]?.align ?? 'left',
          lineBreak: false,
          ellipsis: true,
        })
      x += widths[index]
    })
    doc.y = y + ROW_HEIGHT
    rule(doc)
  }
  doc.y += 12
}

function footer(doc: Doc, data: AnalyticsReportPdfData) {
  ensureSpace(doc, 24)
  doc
    .font(FONT)
    .fontSize(8)
    .fillColor(MUTED)
    .text(`Created by ${data.storeName} · ${data.generatedText}`, MARGIN, doc.y, {
      width: contentWidth(doc),
      align: 'center',
    })
}
