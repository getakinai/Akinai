import { useState, type ReactNode } from 'react'
import { cn, field, iconButton } from '~/lib/styles'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Table,
  Underline,
  Undo2,
} from 'lucide-react'
import { useSlate, useSlateSelection } from 'slate-react'
import {
  getActiveLinkUrl,
  insertTable,
  isAlignActive,
  isBlockActive,
  isLinkActive,
  isMarkActive,
  toggleAlign,
  toggleBlock,
  toggleMark,
  unwrapLink,
  wrapLink,
} from './commands'

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void
  active: boolean
  children: ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      className={cn(iconButton, 'size-8 shrink-0', active && 'border-line-2 bg-paper text-ink')}
    >
      {children}
    </button>
  )
}

export default function Toolbar({
  showInsertTable = false,
  onInsertTable,
}: {
  showInsertTable?: boolean
  onInsertTable?: () => void
}) {
  const editor = useSlate()
  useSlateSelection()
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  return (
    <div className="border-b border-line bg-paper">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <ToolbarButton onClick={() => editor.undo()} active={false} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.redo()} active={false} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden />

        <ToolbarButton
          onClick={() => toggleMark(editor, 'bold')}
          active={isMarkActive(editor, 'bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleMark(editor, 'italic')}
          active={isMarkActive(editor, 'italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleMark(editor, 'underline')}
          active={isMarkActive(editor, 'underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleMark(editor, 'code')}
          active={isMarkActive(editor, 'code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden />

        <ToolbarButton
          onClick={() => toggleBlock(editor, 'heading-one')}
          active={isBlockActive(editor, 'heading-one')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleBlock(editor, 'heading-two')}
          active={isBlockActive(editor, 'heading-two')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleBlock(editor, 'block-quote')}
          active={isBlockActive(editor, 'block-quote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden />

        <ToolbarButton
          onClick={() => toggleBlock(editor, 'numbered-list')}
          active={isBlockActive(editor, 'numbered-list')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleBlock(editor, 'bulleted-list')}
          active={isBlockActive(editor, 'bulleted-list')}
          title="Bulleted list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            setLinkUrl(getActiveLinkUrl(editor))
            setLinkOpen((open) => !open)
          }}
          active={isLinkActive(editor) || linkOpen}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden />

        <ToolbarButton
          onClick={() => toggleAlign(editor, 'left')}
          active={isAlignActive(editor, 'left')}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleAlign(editor, 'center')}
          active={isAlignActive(editor, 'center')}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleAlign(editor, 'right')}
          active={isAlignActive(editor, 'right')}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleAlign(editor, 'justify')}
          active={isAlignActive(editor, 'justify')}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden />

        <ToolbarButton onClick={() => insertTable(editor)} active={false} title="Insert table">
          <Table className="h-4 w-4" />
        </ToolbarButton>

        {showInsertTable && onInsertTable && (
          <ToolbarButton
            onClick={onInsertTable}
            active={false}
            title="Insert appointment details table"
          >
            <span className="text-[10px] font-semibold leading-none">Appt</span>
          </ToolbarButton>
        )}
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-2.5 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://"
            aria-label="Link URL"
            className={cn(field.input, 'h-9 min-w-0 flex-1 text-[13.5px]')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                wrapLink(editor, linkUrl)
                setLinkOpen(false)
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setLinkOpen(false)
              }
            }}
          />
          <button
            type="button"
            className="h-9 shrink-0 rounded-lg border border-line-2 bg-card px-3 text-[13px] font-medium text-ink hover:bg-paper"
            onMouseDown={(event) => {
              event.preventDefault()
              wrapLink(editor, linkUrl)
              setLinkOpen(false)
            }}
          >
            Apply
          </button>
          {isLinkActive(editor) && (
            <button
              type="button"
              className="h-9 shrink-0 rounded-lg border border-line px-3 text-[13px] text-muted hover:bg-paper hover:text-danger"
              onMouseDown={(event) => {
                event.preventDefault()
                unwrapLink(editor)
                setLinkOpen(false)
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}
