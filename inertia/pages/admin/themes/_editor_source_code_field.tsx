import { useEffect, useRef, useState } from 'react'
import { cn, field } from '~/lib/styles'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { HttpError } from '~/lib/http'
import { useSaveThemeEditorSource } from './_editor_hooks'
import { languageFromThemePath, ThemeEditorCodeMirror } from './_editor_code_mirror'

const shell = cn(
  'overflow-hidden rounded-lg border border-line-2 bg-field shadow-[0_1px_1px_rgba(10,10,11,0.03)]',
  'transition-[border-color,box-shadow] duration-150 focus-within:border-ink focus-within:ring-3 focus-within:ring-ring'
)

type Props = {
  themeId: string
  path: string
  content: string
  isLoading: boolean
  loadError: string | null
}

export function ThemeEditorSourceCodeField({
  themeId,
  path,
  content,
  isLoading,
  loadError,
}: Props) {
  const save = useSaveThemeEditorSource(themeId)
  const [text, setText] = useState(content)
  const [error, setError] = useState<string | null>(null)
  const [savedHint, setSavedHint] = useState(false)
  const focusedRef = useRef(false)
  const lastSavedRef = useRef(content)
  /** False until local `text` has caught up with the loaded `content` for `path`. */
  const hydratedRef = useRef(false)
  const debouncedText = useDebouncedValue(text, 500)
  const language = languageFromThemePath(path)

  useEffect(() => {
    hydratedRef.current = false
    focusedRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when switching files
    setError(null)
    setSavedHint(false)
  }, [path])

  useEffect(() => {
    if (isLoading || loadError) {
      hydratedRef.current = false
      return
    }
    focusedRef.current = false
    lastSavedRef.current = content
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from server once loaded
    setText(content)
  }, [path, content, isLoading, loadError])

  useEffect(() => {
    if (isLoading || loadError) return
    if (text === content) hydratedRef.current = true
  }, [text, content, isLoading, loadError])

  useEffect(() => {
    if (!hydratedRef.current || isLoading || loadError) return
    if (text !== debouncedText) return
    if (debouncedText === lastSavedRef.current) return
    save.mutate(
      { path, content: debouncedText },
      {
        onSuccess: () => {
          lastSavedRef.current = debouncedText
          setError(null)
          setSavedHint(true)
        },
        onError: (err) => {
          setError(err instanceof HttpError ? err.message : 'Could not save this file')
        },
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save mutation is stable enough for debounced autosave
  }, [debouncedText, isLoading, loadError, path, text])

  if (isLoading) {
    return <p className="text-[13px] text-muted">Loading {path}…</p>
  }

  if (loadError) {
    return <p className="text-[13px] text-destructive">{loadError}</p>
  }

  return (
    <div className={field.wrapper}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-muted">{path}</p>
        {save.isPending ? (
          <p className="text-[11px] text-muted">Saving…</p>
        ) : savedHint ? (
          <p className="text-[11px] text-muted">Draft saved</p>
        ) : null}
      </div>
      <div className={shell}>
        <ThemeEditorCodeMirror
          key={path}
          value={text}
          language={language}
          onFocus={() => {
            focusedRef.current = true
          }}
          onBlur={() => {
            focusedRef.current = false
          }}
          onChange={(next) => {
            setSavedHint(false)
            setText(next)
          }}
        />
      </div>
      {error ? <p className={field.error}>{error}</p> : null}
    </div>
  )
}
