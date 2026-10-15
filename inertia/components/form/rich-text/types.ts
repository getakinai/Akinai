import type { BaseEditor, BaseText } from 'slate'
import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type TextMarks = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
}

export type CustomText = BaseText & TextMarks

export type LinkElement = {
  type: 'link'
  url: string
  style?: string
  children: CustomText[]
}

export type ParagraphElement = {
  type: 'paragraph'
  style?: string
  align?: TextAlign
  children: Array<CustomText | LinkElement>
}

export type HeadingOneElement = {
  type: 'heading-one'
  style?: string
  align?: TextAlign
  children: Array<CustomText | LinkElement>
}

export type HeadingTwoElement = {
  type: 'heading-two'
  style?: string
  align?: TextAlign
  children: Array<CustomText | LinkElement>
}

export type HeadingThreeElement = {
  type: 'heading-three'
  style?: string
  align?: TextAlign
  children: Array<CustomText | LinkElement>
}

export type BlockQuoteElement = {
  type: 'block-quote'
  style?: string
  align?: TextAlign
  children: Array<CustomText | LinkElement>
}

export type ListItemElement = {
  type: 'list-item'
  style?: string
  align?: TextAlign
  children: CustomElement[]
}

export type BulletedListElement = {
  type: 'bulleted-list'
  style?: string
  children: ListItemElement[]
}

export type NumberedListElement = {
  type: 'numbered-list'
  style?: string
  children: ListItemElement[]
}

export type TableCellElement = {
  type: 'table-cell'
  style?: string
  header?: boolean
  children: CustomElement[]
}

export type TableRowElement = {
  type: 'table-row'
  style?: string
  children: TableCellElement[]
}

export type TableElement = {
  type: 'table'
  style?: string
  cellpadding?: string
  cellspacing?: string
  children: TableRowElement[]
}

export type StyledBoxElement = {
  type: 'styled-box'
  style?: string
  children: CustomElement[]
}

export type HtmlBlockElement = {
  type: 'html-block'
  html: string
  children: [CustomText]
}

export type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | BlockQuoteElement
  | ListItemElement
  | BulletedListElement
  | NumberedListElement
  | LinkElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | StyledBoxElement
  | HtmlBlockElement

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}

/** Fresh empty document. Never reuse across editors — Slate keys nodes by identity. */
export function createEmptyValue(): CustomElement[] {
  return [{ type: 'paragraph', children: [{ text: '' }] }]
}

export const EMPTY_VALUE: CustomElement[] = createEmptyValue()

export const LIST_TYPES = ['bulleted-list', 'numbered-list'] as const
export type ListType = (typeof LIST_TYPES)[number]

export const HEADING_TYPES = ['heading-one', 'heading-two', 'heading-three'] as const
export type HeadingType = (typeof HEADING_TYPES)[number]

export const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'] as const
