import { stripHtml } from '~/utils/strip_html'
import { Text } from 'slate'
import { isHtmlEmailBody } from '~/utils/email_template_html'
import { sanitizeRichTextHref } from './href'
import {
  createEmptyValue,
  type CustomElement,
  type CustomText,
  type HtmlBlockElement,
  type LinkElement,
  type ListItemElement,
  type TableCellElement,
  type TableRowElement,
  type TextAlign,
} from './types'

type Marks = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
}

type InlineNode = CustomText | LinkElement
type Deserialized = CustomElement | InlineNode

const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'div',
  'section',
  'article',
  'pre',
])

const VOID_HTML_TAGS = new Set(['img', 'hr', 'iframe', 'video', 'audio', 'svg'])

function emptyParagraph(style?: string): CustomElement {
  return style
    ? { type: 'paragraph', style, children: [{ text: '' }] }
    : { type: 'paragraph', children: [{ text: '' }] }
}

function getStyle(el: Element): string | undefined {
  const style = el.getAttribute('style')?.trim()
  return style || undefined
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function styleAttr(style?: string, align?: TextAlign): string {
  const parts: string[] = []
  if (style) parts.push(style)
  if (align) parts.push(`text-align:${align}`)
  if (parts.length === 0) return ''
  return ` style="${escapeAttr(parts.join(';'))}"`
}

function parseAlign(style?: string): { align?: TextAlign; style?: string } {
  if (!style) return {}
  const parts = style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  let align: TextAlign | undefined
  const rest: string[] = []
  for (const part of parts) {
    const colon = part.indexOf(':')
    if (colon === -1) {
      rest.push(part)
      continue
    }
    const key = part.slice(0, colon).trim().toLowerCase()
    const value = part.slice(colon + 1).trim() as TextAlign
    if (key === 'text-align' && ['left', 'center', 'right', 'justify'].includes(value)) {
      align = value
    } else {
      rest.push(part)
    }
  }
  return {
    ...(align ? { align } : {}),
    ...(rest.length > 0 ? { style: rest.join(';') } : {}),
  }
}

function blockProps(style?: string): { align?: TextAlign; style?: string } {
  return parseAlign(style)
}

function withMarks(text: string, marks: Marks): CustomText {
  const node: CustomText = { text }
  if (marks.bold) node.bold = true
  if (marks.italic) node.italic = true
  if (marks.underline) node.underline = true
  if (marks.code) node.code = true
  return node
}

function isInlineNode(node: Deserialized): node is InlineNode {
  return Text.isText(node) || (node as CustomElement).type === 'link'
}

function flatten(nodes: Array<Deserialized | Deserialized[] | null>): Deserialized[] {
  const result: Deserialized[] = []
  for (const node of nodes) {
    if (!node) continue
    if (Array.isArray(node)) {
      result.push(...flatten(node))
    } else {
      result.push(node)
    }
  }
  return result
}

function mergeAdjacentText(nodes: Deserialized[]): Deserialized[] {
  const result: Deserialized[] = []
  for (const node of nodes) {
    const prev = result[result.length - 1]
    if (Text.isText(node) && prev && Text.isText(prev)) {
      if (
        prev.bold === node.bold &&
        prev.italic === node.italic &&
        prev.underline === node.underline &&
        prev.code === node.code
      ) {
        result[result.length - 1] = { ...prev, text: prev.text + node.text }
        continue
      }
    }
    result.push(node)
  }
  return result
}

function ensureInlineChildren(nodes: Deserialized[]): InlineNode[] {
  const inlines: InlineNode[] = []
  for (const node of mergeAdjacentText(nodes)) {
    if (Text.isText(node) || (node as CustomElement).type === 'link') {
      inlines.push(node as InlineNode)
      continue
    }
    const element = node as CustomElement
    if ('children' in element) {
      inlines.push(...ensureInlineChildren(element.children as Deserialized[]))
    }
  }
  return inlines.length > 0 ? inlines : [{ text: '' }]
}

function wrapInlinesAsBlocks(nodes: Deserialized[], style?: string): CustomElement[] {
  const blocks: CustomElement[] = []
  let inlines: InlineNode[] = []

  const flush = () => {
    if (inlines.length === 0) return
    const meaningful = inlines.some((n) => (Text.isText(n) ? n.text.length > 0 : true))
    if (meaningful) {
      blocks.push({ type: 'paragraph', ...blockProps(style), children: inlines })
    }
    inlines = []
  }

  for (const node of mergeAdjacentText(nodes)) {
    if (isInlineNode(node)) {
      inlines.push(node)
    } else {
      flush()
      blocks.push(node)
    }
  }
  flush()
  return blocks.length > 0 ? blocks : [emptyParagraph(style)]
}

function hasBlockElementChild(el: Element): boolean {
  return Array.from(el.children).some((child) => BLOCK_TAGS.has(child.tagName.toLowerCase()))
}

function deserializeChildren(el: Element, marks: Marks): Deserialized[] {
  return mergeAdjacentText(
    flatten(Array.from(el.childNodes).map((child) => deserializeNode(child, marks)))
  )
}

function deserializeNode(node: Node, marks: Marks): Deserialized | Deserialized[] | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (text === '') return null
    return withMarks(text, marks)
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (tag === 'br') {
    return withMarks('\n', marks)
  }

  if (VOID_HTML_TAGS.has(tag)) {
    const htmlBlock: HtmlBlockElement = {
      type: 'html-block',
      html: el.outerHTML,
      children: [{ text: '' }],
    }
    return htmlBlock
  }

  const nextMarks: Marks = { ...marks }
  if (tag === 'strong' || tag === 'b') nextMarks.bold = true
  if (tag === 'em' || tag === 'i') nextMarks.italic = true
  if (tag === 'u') nextMarks.underline = true
  if (tag === 'code') nextMarks.code = true

  if (tag === 'span' || tag === 'font' || tag === 'code') {
    const children = deserializeChildren(el, nextMarks)
    return children.length > 0 ? children : null
  }

  if (tag === 'a') {
    const url = sanitizeRichTextHref(el.getAttribute('href') ?? '')
    if (!url) {
      return deserializeChildren(el, nextMarks)
    }
    const children = ensureInlineChildren(deserializeChildren(el, nextMarks)).filter(Text.isText)
    const link: LinkElement = {
      type: 'link',
      url,
      ...(getStyle(el) ? { style: getStyle(el) } : {}),
      children: children.length > 0 ? children : [{ text: url || '' }],
    }
    return link
  }

  const style = getStyle(el)
  const children = deserializeChildren(el, nextMarks)

  switch (tag) {
    case 'body':
      return wrapInlinesAsBlocks(children)
    case 'p':
      return {
        type: 'paragraph',
        ...blockProps(style),
        children: ensureInlineChildren(children),
      }
    case 'h1':
      return {
        type: 'heading-one',
        ...blockProps(style),
        children: ensureInlineChildren(children),
      }
    case 'h2':
      return {
        type: 'heading-two',
        ...blockProps(style),
        children: ensureInlineChildren(children),
      }
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return {
        type: 'heading-three',
        ...blockProps(style),
        children: ensureInlineChildren(children),
      }
    case 'blockquote':
      return {
        type: 'block-quote',
        ...blockProps(style),
        children: ensureInlineChildren(children),
      }
    case 'ul':
      return {
        type: 'bulleted-list',
        ...(style ? { style } : {}),
        children: childrenToListItems(children),
      }
    case 'ol':
      return {
        type: 'numbered-list',
        ...(style ? { style } : {}),
        children: childrenToListItems(children),
      }
    case 'li':
      return {
        type: 'list-item',
        ...blockProps(style),
        children: wrapInlinesAsBlocks(children),
      }
    case 'table':
      return deserializeTable(el, children)
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return children
    case 'tr':
      return {
        type: 'table-row',
        ...(style ? { style } : {}),
        children: childrenToTableCells(children),
      }
    case 'td':
    case 'th':
      return {
        type: 'table-cell',
        ...(style ? { style } : {}),
        ...(tag === 'th' ? { header: true } : {}),
        children: wrapInlinesAsBlocks(children),
      }
    case 'div':
    case 'section':
    case 'article':
      if (hasBlockElementChild(el)) {
        return {
          type: 'styled-box',
          ...(style ? { style } : {}),
          children: wrapInlinesAsBlocks(children),
        }
      }
      return wrapInlinesAsBlocks(children, style)
    default:
      if (hasBlockElementChild(el)) {
        return wrapInlinesAsBlocks(children)
      }
      return children.length > 0 ? children : withMarks(el.textContent ?? '', marks)
  }
}

function childrenToListItems(children: Deserialized[]): ListItemElement[] {
  const items: ListItemElement[] = []
  for (const child of children) {
    if (!isInlineNode(child) && child.type === 'list-item') {
      items.push(child)
    } else if (
      !isInlineNode(child) &&
      (child.type === 'bulleted-list' || child.type === 'numbered-list')
    ) {
      items.push(...child.children)
    } else {
      items.push({ type: 'list-item', children: wrapInlinesAsBlocks([child]) })
    }
  }
  return items.length > 0 ? items : [{ type: 'list-item', children: [emptyParagraph()] }]
}

function childrenToTableCells(children: Deserialized[]): TableCellElement[] {
  const cells: TableCellElement[] = []
  for (const child of children) {
    if (!isInlineNode(child) && child.type === 'table-cell') {
      cells.push(child)
    } else {
      cells.push({ type: 'table-cell', children: wrapInlinesAsBlocks([child]) })
    }
  }
  return cells.length > 0 ? cells : [{ type: 'table-cell', children: [emptyParagraph()] }]
}

function deserializeTable(el: HTMLElement, children: Deserialized[]): CustomElement {
  const rows: TableRowElement[] = []
  for (const child of children) {
    if (!isInlineNode(child) && child.type === 'table-row') {
      rows.push(child)
    }
  }
  const table: CustomElement = {
    type: 'table',
    ...(getStyle(el) ? { style: getStyle(el) } : {}),
    ...(el.getAttribute('cellpadding')
      ? { cellpadding: el.getAttribute('cellpadding') ?? undefined }
      : {}),
    ...(el.getAttribute('cellspacing')
      ? { cellspacing: el.getAttribute('cellspacing') ?? undefined }
      : {}),
    children:
      rows.length > 0
        ? rows
        : [{ type: 'table-row', children: [{ type: 'table-cell', children: [emptyParagraph()] }] }],
  }
  return table
}

function plainTextToSlate(value: string): CustomElement[] {
  const lines = value.split(/\r?\n/)
  if (lines.length === 0) return createEmptyValue()
  return lines.map((line) => ({
    type: 'paragraph' as const,
    children: [{ text: line }],
  }))
}

export function htmlToSlate(value: string): CustomElement[] {
  if (!value?.trim()) {
    return createEmptyValue()
  }

  if (!isHtmlEmailBody(value)) {
    return plainTextToSlate(value)
  }

  if (typeof DOMParser === 'undefined') {
    return plainTextToSlate(stripHtml(value))
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(value, 'text/html')
    const deserialized = deserializeNode(doc.body, {})
    const nodes = flatten([deserialized])
    const blocks = wrapInlinesAsBlocks(nodes)
    return blocks.length > 0 ? blocks : createEmptyValue()
  } catch {
    return plainTextToSlate(value)
  }
}

function serializeText(node: CustomText): string {
  let html = escapeHtml(node.text).replace(/\r\n|\n|\r/g, '<br>')
  if (node.bold) html = `<strong>${html}</strong>`
  if (node.italic) html = `<em>${html}</em>`
  if (node.underline) html = `<u>${html}</u>`
  if (node.code) html = `<code>${html}</code>`
  return html
}

function serializeInlines(nodes: Array<CustomText | LinkElement>): string {
  return nodes
    .map((node) => {
      if (Text.isText(node)) return serializeText(node)
      if (node.type === 'link') {
        const inner = node.children.map(serializeText).join('')
        return `<a href="${escapeAttr(node.url)}"${styleAttr(node.style)}>${inner || escapeHtml(node.url)}</a>`
      }
      return ''
    })
    .join('')
}

function isEmptyInlineContent(nodes: Array<CustomText | LinkElement>): boolean {
  return nodes.every((node) => Text.isText(node) && node.text === '')
}

function serializeElement(node: CustomElement): string {
  switch (node.type) {
    case 'paragraph': {
      const inner = serializeInlines(node.children)
      if (isEmptyInlineContent(node.children)) {
        return `<p${styleAttr(node.style, node.align)}><br></p>`
      }
      return `<p${styleAttr(node.style, node.align)}>${inner}</p>`
    }
    case 'heading-one':
      return `<h1${styleAttr(node.style, node.align)}>${serializeInlines(node.children)}</h1>`
    case 'heading-two':
      return `<h2${styleAttr(node.style, node.align)}>${serializeInlines(node.children)}</h2>`
    case 'heading-three':
      return `<h3${styleAttr(node.style, node.align)}>${serializeInlines(node.children)}</h3>`
    case 'block-quote':
      return `<blockquote${styleAttr(node.style, node.align)}>${serializeInlines(node.children)}</blockquote>`
    case 'bulleted-list':
      return `<ul${styleAttr(node.style)}>${node.children.map(serializeElement).join('')}</ul>`
    case 'numbered-list':
      return `<ol${styleAttr(node.style)}>${node.children.map(serializeElement).join('')}</ol>`
    case 'list-item': {
      const inner = node.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return serializeInlines(child.children)
          }
          return serializeElement(child)
        })
        .join('')
      return `<li${styleAttr(node.style, node.align)}>${inner}</li>`
    }
    case 'link':
      return `<a href="${escapeAttr(node.url)}"${styleAttr(node.style)}>${serializeInlines(node.children)}</a>`
    case 'table': {
      const extra: string[] = []
      if (node.cellpadding) extra.push(` cellpadding="${escapeAttr(node.cellpadding)}"`)
      if (node.cellspacing) extra.push(` cellspacing="${escapeAttr(node.cellspacing)}"`)
      return `<table${styleAttr(node.style)}${extra.join('')}>${node.children.map(serializeElement).join('')}</table>`
    }
    case 'table-row':
      return `<tr${styleAttr(node.style)}>${node.children.map(serializeElement).join('')}</tr>`
    case 'table-cell': {
      const tag = node.header ? 'th' : 'td'
      const inner = node.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return serializeInlines(child.children)
          }
          return serializeElement(child)
        })
        .join('')
      return `<${tag}${styleAttr(node.style)}>${inner}</${tag}>`
    }
    case 'styled-box':
      return `<div${styleAttr(node.style)}>${node.children.map(serializeElement).join('')}</div>`
    case 'html-block':
      return node.html
    default:
      return ''
  }
}

export function slateToHtml(nodes: CustomElement[]): string {
  if (!nodes || nodes.length === 0) return ''
  const isEmptyDoc =
    nodes.length === 1 && nodes[0].type === 'paragraph' && isEmptyInlineContent(nodes[0].children)
  if (isEmptyDoc) return ''
  return nodes.map(serializeElement).join('')
}
