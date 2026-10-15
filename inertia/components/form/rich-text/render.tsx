import type { CSSProperties } from 'react'
import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import { sanitizeHtml } from '~/lib/sanitize_html'
import type { TextAlign } from './types'

function styleFrom(style?: string): CSSProperties | undefined {
  if (!style) return undefined
  const result: Record<string, string> = {}
  for (const part of style.split(';')) {
    const colon = part.indexOf(':')
    if (colon === -1) continue
    const key = part.slice(0, colon).trim()
    const value = part.slice(colon + 1).trim()
    if (!key || !value) continue
    const camel = key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    result[camel] = value
  }
  return Object.keys(result).length > 0 ? (result as CSSProperties) : undefined
}

function blockStyle(style?: string, align?: TextAlign): CSSProperties | undefined {
  const base = styleFrom(style) ?? {}
  const merged = align ? { ...base, textAlign: align } : base
  return Object.keys(merged).length > 0 ? merged : undefined
}

export function renderElement({ attributes, children, element }: RenderElementProps) {
  const align = 'align' in element ? element.align : undefined
  const style = 'style' in element ? blockStyle(element.style, align) : blockStyle(undefined, align)

  switch (element.type) {
    case 'heading-one':
      return (
        <h1 {...attributes} className="mb-4 text-2xl font-bold" style={style}>
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 {...attributes} className="mb-3 text-xl font-bold" style={style}>
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 {...attributes} className="mb-2 text-lg font-bold" style={style}>
          {children}
        </h3>
      )
    case 'block-quote':
      return (
        <blockquote
          {...attributes}
          className="my-3 border-l-4 border-line-2 pl-4 italic text-muted"
          style={style}
        >
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul {...attributes} className="mb-4 list-inside list-disc" style={style}>
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol {...attributes} className="mb-4 list-inside list-decimal" style={style}>
          {children}
        </ol>
      )
    case 'list-item':
      return (
        <li {...attributes} className="mb-1" style={style}>
          {children}
        </li>
      )
    case 'link':
      return (
        <a
          {...attributes}
          href={element.url}
          className="text-accent underline decoration-line-2 underline-offset-2 hover:decoration-accent"
          style={style}
        >
          {children}
        </a>
      )
    case 'table':
      return (
        <table
          {...attributes}
          className="mb-3 w-full border-collapse text-sm"
          style={style}
          cellPadding={element.cellpadding ? Number(element.cellpadding) : undefined}
          cellSpacing={element.cellspacing ? Number(element.cellspacing) : undefined}
        >
          {children}
        </table>
      )
    case 'table-row':
      return (
        <tr {...attributes} style={style}>
          {children}
        </tr>
      )
    case 'table-cell': {
      const CellTag = element.header ? 'th' : 'td'
      return (
        <CellTag {...attributes} className="border border-line px-2 py-1 align-top" style={style}>
          {children}
        </CellTag>
      )
    }
    case 'styled-box':
      return (
        <div {...attributes} className="my-2 rounded-md p-3" style={style}>
          {children}
        </div>
      )
    case 'html-block':
      return (
        <div
          {...attributes}
          className="my-2 rounded border border-dashed border-line-2 p-2 text-[13px]"
          contentEditable={false}
        >
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(element.html) }} />
          {children}
        </div>
      )
    default:
      return (
        <p {...attributes} className="mb-2" style={style}>
          {children}
        </p>
      )
  }
}

export function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  let content = children
  if (leaf.bold) {
    content = <strong>{content}</strong>
  }
  if (leaf.italic) {
    content = <em>{content}</em>
  }
  if (leaf.underline) {
    content = <u>{content}</u>
  }
  if (leaf.code) {
    content = <code className="rounded bg-paper px-1 py-0.5 font-mono text-[13px]">{content}</code>
  }
  return (
    <span {...attributes} style={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </span>
  )
}
