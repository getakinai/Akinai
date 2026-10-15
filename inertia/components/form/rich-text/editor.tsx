import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Transforms } from 'slate'
import type { Descendant } from 'slate'
import { Editable, ReactEditor, Slate } from 'slate-react'
import { cn } from '~/lib/styles'
import { toggleMark } from './commands'
import { htmlToSlate, slateToHtml } from './html'
import { renderElement, renderLeaf } from './render'
import Toolbar from './toolbar'
import type { CustomElement } from './types'
import { createRichTextEditor, selectEndIfNeeded } from './with_plugins'

export interface RichTextEditorHandle {
  insertText: (text: string) => void
  insertHtml: (html: string) => void
  focus: () => void
  /** Latest HTML from the editor document (call before form submit). */
  getHtml: () => string
}

export interface RichTextEditorProps {
  /** Remount the Slate document when this changes (record id, autofill, etc.). */
  documentKey: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  showToolbar?: boolean
  disabled?: boolean
  showInsertTable?: boolean
  appointmentDetailsTableHtml?: string
  inputId?: string
}

type RichTextEditorDocumentProps = Omit<RichTextEditorProps, 'documentKey' | 'value'> & {
  initialHtml: string
}

const RichTextEditorDocument = forwardRef<RichTextEditorHandle, RichTextEditorDocumentProps>(
  function RichTextEditorDocumentInner(
    {
      initialHtml,
      onChange,
      placeholder = 'Enter your text…',
      minHeight = 200,
      showToolbar = true,
      disabled = false,
      showInsertTable = false,
      appointmentDetailsTableHtml,
      inputId,
    },
    ref
  ) {
    const [editor] = useState(() => {
      const instance = createRichTextEditor()
      instance.children = htmlToSlate(initialHtml ?? '')
      return instance
    })
    const [initialValue] = useState(() => htmlToSlate(initialHtml ?? ''))
    const lastEmittedHtml = useRef(slateToHtml(initialValue))
    const onChangeRef = useRef(onChange)

    useEffect(() => {
      onChangeRef.current = onChange
    }, [onChange])

    const emitHtml = useCallback((html: string) => {
      if (html === lastEmittedHtml.current) {
        return
      }
      lastEmittedHtml.current = html
      onChangeRef.current(html)
    }, [])

    const readHtmlFromEditor = useCallback(() => {
      return slateToHtml(editor.children as CustomElement[])
    }, [editor])

    const emitCurrentHtml = useCallback(() => {
      emitHtml(readHtmlFromEditor())
    }, [emitHtml, readHtmlFromEditor])

    const handleValueChange = useCallback(
      (nodes: Descendant[]) => {
        emitHtml(slateToHtml(nodes as CustomElement[]))
      },
      [emitHtml]
    )

    const focusEditor = useCallback(() => {
      ReactEditor.focus(editor)
      selectEndIfNeeded(editor)
    }, [editor])

    const insertText = useCallback(
      (text: string) => {
        focusEditor()
        Transforms.insertText(editor, text)
      },
      [editor, focusEditor]
    )

    const insertHtml = useCallback(
      (html: string) => {
        focusEditor()
        const fragment = htmlToSlate(html)
        Transforms.insertFragment(editor, fragment)
      },
      [editor, focusEditor]
    )

    useImperativeHandle(
      ref,
      () => ({
        insertText,
        insertHtml,
        focus: focusEditor,
        getHtml: readHtmlFromEditor,
      }),
      [insertText, insertHtml, focusEditor, readHtmlFromEditor]
    )

    const handleInsertTable = useCallback(() => {
      if (appointmentDetailsTableHtml) {
        insertHtml(appointmentDetailsTableHtml)
      }
    }, [appointmentDetailsTableHtml, insertHtml])

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey)) return
        const key = event.key.toLowerCase()
        if (key === 'b') {
          event.preventDefault()
          toggleMark(editor, 'bold')
        } else if (key === 'i') {
          event.preventDefault()
          toggleMark(editor, 'italic')
        } else if (key === 'u') {
          event.preventDefault()
          toggleMark(editor, 'underline')
        } else if (key === '`') {
          event.preventDefault()
          toggleMark(editor, 'code')
        }
      },
      [editor]
    )

    const editableMinHeight = minHeight - (showToolbar ? 52 : 0)

    return (
      <div className={cn(disabled && 'pointer-events-none')} dir="ltr" id={inputId}>
        <Slate editor={editor} initialValue={initialValue} onValueChange={handleValueChange}>
          {showToolbar && (
            <Toolbar showInsertTable={showInsertTable} onInsertTable={handleInsertTable} />
          )}
          <div className="relative min-w-0" style={{ minHeight: editableMinHeight }}>
            <Editable
              className="rich-text-content min-h-full resize-none px-3 py-2.5 text-[14px] leading-[1.55] text-ink outline-none"
              style={{ minHeight: editableMinHeight }}
              placeholder={placeholder}
              readOnly={disabled}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={handleKeyDown}
              onFocus={emitCurrentHtml}
              onBlur={emitCurrentHtml}
              aria-label={placeholder}
            />
          </div>
        </Slate>
      </div>
    )
  }
)

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditorOuter({ documentKey, value, ...rest }, ref) {
    return <RichTextEditorDocument key={documentKey} ref={ref} initialHtml={value} {...rest} />
  }
)

export default RichTextEditor
