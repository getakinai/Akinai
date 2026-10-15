import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import InfoTooltip from '~/components/ui/info_tooltip'
import Skeleton from '~/components/ui/skeleton'
import Tabs, { TabPanel } from '~/components/ui/tabs'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { cn, field } from '~/lib/styles'

type MarkdownTab = 'write' | 'preview'

export type FormMarkdownEditorPreview = {
  html: string | undefined
  isLoading: boolean
  isError: boolean
}

type FormMarkdownEditorProps = {
  name: string
  label: string
  value: string
  onChange: (markdown: string) => void
  /**
   * Called (debounced) with the markdown while the preview is showing, so
   * the page can render it with the server's sanitizer.
   */
  onPreview: (markdown: string) => void
  preview: FormMarkdownEditorPreview
  error?: string
  disabled?: boolean
  placeholder?: string
  rows?: number
  tooltip?: ReactNode
  /** Classes for the rendered preview, matching where the content is shown. */
  previewClassName?: string
}

const PREVIEW_DELAY_MS = 300

/** Matches Tailwind's `xl`, wide enough beside the admin sidebar for two panes. */
const WIDE_QUERY = '(min-width: 1280px)'

function subscribeToWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useIsWide() {
  return useSyncExternalStore(
    subscribeToWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false
  )
}

/**
 * Markdown textarea with a live preview beside it on wide screens, and
 * Write / Preview tabs on narrow ones. The preview HTML comes from the
 * caller and is sanitized again before it is shown.
 */
export default function FormMarkdownEditor({
  name,
  label,
  value,
  onChange,
  onPreview,
  preview,
  error,
  disabled = false,
  placeholder,
  rows = 26,
  tooltip,
  previewClassName,
}: FormMarkdownEditorProps) {
  const idPrefix = useId()
  const [tab, setTab] = useState<MarkdownTab>('write')
  const split = useIsWide()
  const previewing = split || tab === 'preview'

  useEffect(() => {
    if (!previewing) return
    const timer = setTimeout(() => onPreview(value), PREVIEW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [previewing, value, onPreview])

  const html = preview.html ? sanitizeHtml(preview.html) : ''

  const textarea = (
    <textarea
      id={name}
      name={name}
      rows={rows}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      spellCheck
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        field.input,
        'h-auto min-h-80 w-full resize-y py-2.5 font-mono text-[13px] leading-[1.6]'
      )}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${name}-error` : undefined}
    />
  )

  const previewBody = preview.isError ? (
    <p className="text-[13.5px] text-danger">Could not render the preview.</p>
  ) : preview.isLoading && !html ? (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ) : html ? (
    <div className={previewClassName} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <p className="text-[13.5px] text-muted">Nothing to preview yet.</p>
  )

  return (
    <div className={field.wrapper}>
      <div className="relative flex items-center gap-1">
        <label className={field.label} htmlFor={name}>
          {label}
        </label>
        {tooltip && <InfoTooltip label={`About ${label.toLowerCase()}`}>{tooltip}</InfoTooltip>}
      </div>
      {split ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[12px] font-medium text-muted">Markdown</span>
            {textarea}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[12px] font-medium text-muted">Preview</span>
            <div className="relative flex-1">
              <div
                className="absolute inset-0 overflow-y-auto rounded-lg border border-line-2 bg-paper p-4"
                aria-live="polite"
                aria-busy={preview.isLoading}
              >
                {previewBody}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Tabs
            idPrefix={idPrefix}
            label={`${label} editor`}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'write', label: 'Write', invalid: Boolean(error) },
              { id: 'preview', label: 'Preview' },
            ]}
          />
          <TabPanel idPrefix={idPrefix} id="write" active={tab === 'write'}>
            {textarea}
          </TabPanel>
          <TabPanel idPrefix={idPrefix} id="preview" active={tab === 'preview'}>
            <div
              className="min-h-80 rounded-lg border border-line-2 bg-paper p-4"
              aria-live="polite"
              aria-busy={preview.isLoading}
            >
              {previewBody}
            </div>
          </TabPanel>
        </>
      )}
      {error && (
        <span id={`${name}-error`} className={field.error}>
          {error}
        </span>
      )}
    </div>
  )
}
