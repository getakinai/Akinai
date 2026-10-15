import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, field } from '~/lib/styles'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { ThemeEditorCodeMirror } from './_editor_code_mirror'
import { ThemeTemplateDataSchema, type ThemeTemplateData } from './_editor_types'
import { normalizeTemplateJsonPayload } from './_editor_utils'

const shell = cn(
  'overflow-hidden rounded-lg border border-line-2 bg-field shadow-[0_1px_1px_rgba(10,10,11,0.03)]',
  'transition-[border-color,box-shadow] duration-150 focus-within:border-ink focus-within:ring-3 focus-within:ring-ring'
)

type Props = {
  template: ThemeTemplateData
  templateName: string
  onApply: (data: ThemeTemplateData) => void
}

export function ThemeEditorTemplateJsonField({ template, templateName, onApply }: Props) {
  const canonical = useMemo(
    () => JSON.stringify({ sections: template.sections, order: template.order }, null, 2),
    [template.order, template.sections]
  )
  const [text, setText] = useState(canonical)
  const [error, setError] = useState<string | null>(null)
  const focusedRef = useRef(false)
  const debouncedText = useDebouncedValue(text, 400)

  useEffect(() => {
    focusedRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset JSON when switching templates
    setText(canonical)
    setError(null)
  }, [templateName, canonical])

  useEffect(() => {
    if (focusedRef.current) return
    setText(canonical)
  }, [canonical])

  useEffect(() => {
    if (debouncedText === canonical) return
    try {
      const raw: unknown = JSON.parse(debouncedText)
      const normalized =
        raw && typeof raw === 'object' && 'sections' in raw && 'order' in raw
          ? normalizeTemplateJsonPayload(
              raw as { sections: Record<string, Record<string, unknown>>; order: string[] }
            )
          : raw
      const result = ThemeTemplateDataSchema.safeParse(normalized)
      if (!result.success) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced JSON validation
        setError('Template JSON must include "sections" and "order".')
        return
      }
      setError(null)
      onApply(result.data)
    } catch {
      setError('Invalid JSON syntax.')
    }
  }, [debouncedText, canonical, onApply])

  return (
    <div className={field.wrapper}>
      <div className={shell}>
        <ThemeEditorCodeMirror
          value={text}
          language="json"
          onFocus={() => {
            focusedRef.current = true
          }}
          onBlur={() => {
            focusedRef.current = false
          }}
          onChange={setText}
        />
      </div>
      {error ? <p className={field.error}>{error}</p> : null}
    </div>
  )
}
