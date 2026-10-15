import { createEditor, Editor, Element as SlateElement, Node, Text, Transforms } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { htmlToSlate } from './html'
import { isAbsoluteHttpUrl } from './href'
import type { CustomEditor } from './types'

function withLinks(editor: CustomEditor): CustomEditor {
  const { isInline, insertData, normalizeNode } = editor

  editor.isInline = (element) => element.type === 'link' || isInline(element)

  editor.insertData = (data) => {
    const text = data.getData('text/plain')
    if (text && isAbsoluteHttpUrl(text) && editor.selection) {
      Transforms.insertText(editor, text)
      return
    }
    insertData(data)
  }

  editor.normalizeNode = (entry) => {
    const [node, path] = entry
    if (SlateElement.isElement(node) && node.type === 'link' && Node.string(node) === '') {
      Transforms.removeNodes(editor, { at: path })
      return
    }
    normalizeNode(entry)
  }

  return editor
}

function withHtmlBlocks(editor: CustomEditor): CustomEditor {
  const { isVoid } = editor
  editor.isVoid = (element) => element.type === 'html-block' || isVoid(element)
  return editor
}

function withTables(editor: CustomEditor): CustomEditor {
  const { normalizeNode } = editor

  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    if (SlateElement.isElement(node) && node.type === 'table') {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (!SlateElement.isElement(child) || child.type !== 'table-row') {
          Transforms.wrapNodes(editor, { type: 'table-row', children: [] }, { at: childPath })
          return
        }
      }
    }

    if (SlateElement.isElement(node) && node.type === 'table-row') {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (!SlateElement.isElement(child) || child.type !== 'table-cell') {
          Transforms.wrapNodes(editor, { type: 'table-cell', children: [] }, { at: childPath })
          return
        }
      }
    }

    if (SlateElement.isElement(node) && node.type === 'table-cell') {
      if (node.children.length === 0) {
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          { at: [...path, 0] }
        )
        return
      }
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Text.isText(child) || (SlateElement.isElement(child) && editor.isInline(child))) {
          Transforms.wrapNodes(editor, { type: 'paragraph', children: [] }, { at: childPath })
          return
        }
      }
    }

    if (SlateElement.isElement(node) && node.type === 'list-item') {
      if (node.children.length === 0) {
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          { at: [...path, 0] }
        )
        return
      }
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Text.isText(child) || (SlateElement.isElement(child) && editor.isInline(child))) {
          Transforms.wrapNodes(editor, { type: 'paragraph', children: [] }, { at: childPath })
          return
        }
      }
    }

    normalizeNode(entry)
  }

  return editor
}

function withHtmlPaste(editor: CustomEditor): CustomEditor {
  const { insertData } = editor

  editor.insertData = (data) => {
    const html = data.getData('text/html')
    if (html) {
      const fragment = htmlToSlate(html)
      Transforms.insertFragment(editor, fragment)
      return
    }
    insertData(data)
  }

  return editor
}

export function createRichTextEditor(): CustomEditor {
  return withHtmlPaste(
    withTables(withHtmlBlocks(withLinks(withHistory(withReact(createEditor())))))
  )
}

export function createReadOnlyRichTextEditor(): CustomEditor {
  return withTables(withHtmlBlocks(withLinks(withReact(createEditor()))))
}

export function selectEndIfNeeded(editor: CustomEditor): void {
  if (!editor.selection) {
    Transforms.select(editor, Editor.end(editor, []))
  }
}
