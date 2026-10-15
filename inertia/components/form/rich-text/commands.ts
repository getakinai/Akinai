import { Editor, Element as SlateElement, Range, Transforms } from 'slate'
import type {
  CustomEditor,
  CustomElement,
  HeadingType,
  LinkElement,
  ListType,
  TableCellElement,
  TableElement,
  TextAlign,
} from './types'
import { LIST_TYPES } from './types'
import { sanitizeRichTextHref } from './href'

type MarkFormat = 'bold' | 'italic' | 'underline' | 'code'
type BlockFormat = HeadingType | 'block-quote' | 'paragraph' | ListType

export function isMarkActive(editor: CustomEditor, format: MarkFormat): boolean {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

export function toggleMark(editor: CustomEditor, format: MarkFormat): void {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export function isBlockActive(editor: CustomEditor, format: BlockFormat): boolean {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  )

  return Boolean(match)
}

export function toggleBlock(editor: CustomEditor, format: BlockFormat): void {
  const isActive = isBlockActive(editor, format)
  const isList = format === 'bulleted-list' || format === 'numbered-list'

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type as ListType),
    split: true,
  })

  const newType = isActive ? 'paragraph' : isList ? 'list-item' : format
  Transforms.setNodes(editor, { type: newType } as Partial<CustomElement> as never)

  if (!isActive && isList) {
    const list: CustomElement = { type: format, children: [] }
    Transforms.wrapNodes(editor, list)
  }
}

export function isAlignActive(editor: CustomEditor, align: TextAlign): boolean {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && 'align' in n && n.align === align,
    })
  )

  return Boolean(match)
}

export function toggleAlign(editor: CustomEditor, align: TextAlign): void {
  const isActive = isAlignActive(editor, align)
  Transforms.setNodes(editor, { align: isActive ? undefined : align } as never)
}

function emptyTableCell(): TableCellElement {
  return { type: 'table-cell', children: [{ type: 'paragraph', children: [{ text: '' }] }] }
}

export function insertTable(editor: CustomEditor, rows = 3, cols = 3): void {
  const table: TableElement = {
    type: 'table',
    style: 'width:100%;border-collapse:collapse;',
    children: Array.from({ length: rows }, () => ({
      type: 'table-row' as const,
      children: Array.from({ length: cols }, emptyTableCell),
    })),
  }

  Transforms.insertNodes(editor, table)
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] })
}

export function isLinkActive(editor: CustomEditor): boolean {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  })
  return Boolean(link)
}

export function getActiveLinkUrl(editor: CustomEditor): string {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  })
  if (link && SlateElement.isElement(link[0]) && link[0].type === 'link') {
    return link[0].url
  }
  return ''
}

export function unwrapLink(editor: CustomEditor): void {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  })
}

function sanitizeUrl(url: string): string {
  return sanitizeRichTextHref(url)
}

export function wrapLink(editor: CustomEditor, rawUrl: string): void {
  const url = sanitizeUrl(rawUrl)
  if (!url) return

  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link: LinkElement = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [{ text: '' }],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}
