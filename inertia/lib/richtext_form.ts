import type { RichTextEditorHandle } from '~/components/form/rich-text/editor'

/** Read description HTML from the editor ref (Slate may not have flushed React state yet). */
export function richtextFieldValue(editor: RichTextEditorHandle | null, fallback: string): string {
  return editor?.getHtml() ?? fallback
}
