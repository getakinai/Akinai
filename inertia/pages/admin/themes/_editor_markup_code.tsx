import { useEffect, useMemo, useRef, useState } from 'react'
import { html as formatHtml } from 'js-beautify'
import { codeToHtml } from 'shiki/bundle/web'
import { cn } from '~/lib/styles'

export type MarkupCodeLanguage = 'html' | 'css' | 'json'

const codeShell = cn(
  'overflow-x-auto rounded-lg border border-line-2 bg-field shadow-[0_1px_1px_rgba(10,10,11,0.03)]',
  '[&_pre.shiki]:!bg-transparent [&_pre.shiki]:m-0 [&_pre.shiki]:p-3',
  '[&_pre.shiki]:font-mono [&_pre.shiki]:text-[11px] [&_pre.shiki]:leading-relaxed'
)

function adminShikiTheme(): 'github-light' | 'github-dark' {
  if (typeof document === 'undefined') return 'github-light'
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'github-dark'
    : 'github-light'
}

export function formatThemeMarkupCode(language: MarkupCodeLanguage, source: string): string {
  if (language !== 'html') return source
  try {
    return formatHtml(source, {
      indent_size: 2,
      wrap_line_length: 0,
      preserve_newlines: true,
      max_preserve_newlines: 2,
      indent_inner_html: true,
    })
  } catch {
    return source
  }
}

type Props = {
  code: string
  language: MarkupCodeLanguage
  scrollToNeedle?: string | null
  className?: string
}

export function ThemeEditorMarkupCode({ code, language, scrollToNeedle, className }: Props) {
  const [colorScheme, setColorScheme] = useState(adminShikiTheme)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [resolvedKey, setResolvedKey] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const formatted = useMemo(() => formatThemeMarkupCode(language, code), [code, language])
  const highlightKey = `${language}:${colorScheme}:${formatted}`

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setColorScheme(adminShikiTheme()))
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const html = await codeToHtml(formatted, {
          lang: language,
          theme: colorScheme,
        })
        if (!cancelled) {
          setHighlighted(html)
          setResolvedKey(highlightKey)
        }
      } catch {
        if (!cancelled) {
          setHighlighted(null)
          setResolvedKey(highlightKey)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formatted, language, colorScheme, highlightKey])

  const loading = resolvedKey !== highlightKey

  useEffect(() => {
    const root = containerRef.current
    if (!root || loading || !scrollToNeedle) return

    const old = root.querySelector('#markup-scroll-target')
    if (old?.parentNode) {
      const parent = old.parentNode
      while (old.firstChild) parent.insertBefore(old.firstChild, old)
      old.remove()
    }

    const full = root.textContent ?? ''
    const idx = full.indexOf(scrollToNeedle)
    if (idx === -1) return

    let offset = 0
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent ?? ''
      const len = text.length
      if (offset + len > idx) {
        const localIdx = idx - offset
        const range = document.createRange()
        range.setStart(node, localIdx)
        range.setEnd(node, Math.min(localIdx + scrollToNeedle.length, len))
        const mark = document.createElement('mark')
        mark.id = 'markup-scroll-target'
        mark.className = 'scroll-m-4 rounded bg-accent/35 text-inherit'
        try {
          range.surroundContents(mark)
          mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
        } catch {
          mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
        break
      }
      offset += len
    }
  }, [scrollToNeedle, loading, highlighted])

  if (loading && !highlighted) {
    return <p className="text-[13px] text-muted">Highlighting…</p>
  }

  if (!highlighted) {
    return (
      <pre className={cn(codeShell, 'p-3 font-mono text-[11px] leading-relaxed', className)}>
        <code>{formatted}</code>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(codeShell, className)}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}
