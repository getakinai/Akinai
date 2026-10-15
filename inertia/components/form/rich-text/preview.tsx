import { useMemo, useState } from 'react'
import { cn } from '~/lib/styles'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { Editable, Slate } from 'slate-react'
import type { RenderElementProps } from 'slate-react'
import { htmlToSlate } from './html'
import { renderElement, renderLeaf } from './render'
import { createReadOnlyRichTextEditor } from './with_plugins'

function renderPreviewElement(props: RenderElementProps) {
  if (props.element.type === 'html-block') {
    return (
      <div {...props.attributes}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.element.html) }} />
        {props.children}
      </div>
    )
  }

  return renderElement(props)
}

interface RichTextEmailPreviewProps {
  html: string
  className?: string
}

export default function RichTextEmailPreview({ html, className }: RichTextEmailPreviewProps) {
  const [editor] = useState(() => createReadOnlyRichTextEditor())
  const document = useMemo(() => htmlToSlate(html ?? ''), [html])

  if (!html?.trim()) {
    return null
  }

  return (
    <div className={cn('rich-text-content text-left text-ink', className)}>
      <Slate editor={editor} initialValue={document} key={html}>
        <Editable
          readOnly
          aria-readonly
          className="text-sm outline-none"
          renderElement={renderPreviewElement}
          renderLeaf={renderLeaf}
        />
      </Slate>
    </div>
  )
}
