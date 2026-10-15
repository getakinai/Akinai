import { useEffect, useRef, useState, type Ref } from 'react'
import { cn, field } from '~/lib/styles'
import RichTextEditor, { type RichTextEditorHandle } from './rich-text/editor'

export type FormRichtextEditorProps = {
  name: string
  label: string
  value: string
  onChange: (html: string) => void
  error?: string
  hideLabel?: boolean
  placeholder?: string
  minHeight?: number
  disabled?: boolean
  showToolbar?: boolean
  /** Remount the editor when the backing record changes (async load). */
  editorKey?: string
  editorRef?: Ref<RichTextEditorHandle>
}

/**
 * Visually hidden textarea so browser autofill / filler extensions can target a
 * native control by `name`. Remount the Slate document after fill so React is
 * not reconciling against DOM the extension touched.
 */
const autofillBridgeClassName =
  'absolute h-px w-px overflow-hidden border-0 p-0 opacity-0 [clip:rect(0,0,0,0)]'

export default function FormRichtextEditor({
  name,
  label,
  value,
  onChange,
  error,
  hideLabel = false,
  placeholder,
  minHeight = 220,
  disabled = false,
  showToolbar = true,
  editorKey,
  editorRef,
}: FormRichtextEditorProps) {
  const autofillRef = useRef<HTMLTextAreaElement>(null)
  const onChangeRef = useRef(onChange)
  const [contentEpoch, setContentEpoch] = useState(0)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const el = autofillRef.current
    if (!el) return

    function syncFromAutofill(event: Event) {
      const target = event.target
      if (!(target instanceof HTMLTextAreaElement)) return
      onChangeRef.current(target.value)
      setContentEpoch((epoch) => epoch + 1)
    }

    el.addEventListener('input', syncFromAutofill)
    el.addEventListener('change', syncFromAutofill)
    return () => {
      el.removeEventListener('input', syncFromAutofill)
      el.removeEventListener('change', syncFromAutofill)
    }
  }, [])

  const documentKey = `${editorKey ?? name}-${contentEpoch}`

  return (
    <div className={field.wrapper}>
      <label className={hideLabel ? 'sr-only' : field.label} htmlFor={`${name}-editor`}>
        {label}
      </label>
      <textarea
        ref={autofillRef}
        name={name}
        id={`${name}-autofill`}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        defaultValue={value}
        className={autofillBridgeClassName}
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-line-2 bg-field shadow-[0_1px_1px_rgba(10,10,11,0.03)] transition-[border-color,box-shadow] duration-150 focus-within:border-ink focus-within:ring-3 focus-within:ring-ring',
          error && 'border-danger focus-within:border-danger focus-within:ring-danger/25',
          disabled && 'opacity-55'
        )}
        aria-invalid={error ? 'true' : 'false'}
      >
        <RichTextEditor
          documentKey={documentKey}
          ref={editorRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          disabled={disabled}
          showToolbar={showToolbar}
          inputId={`${name}-editor`}
        />
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
