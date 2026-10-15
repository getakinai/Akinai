import { useEffect, useMemo, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { cn } from '~/lib/styles'

export type EditorCodeLanguage = 'html' | 'css' | 'json'

function adminColorScheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

/** Map a theme package path to a CodeMirror language. `.edge` uses HTML. */
export function languageFromThemePath(path: string): EditorCodeLanguage {
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.json')) return 'json'
  return 'html'
}

function languageExtension(language: EditorCodeLanguage) {
  switch (language) {
    case 'css':
      return css()
    case 'json':
      return json()
    default:
      return html()
  }
}

const editorChrome = EditorView.theme({
  '&': {
    fontSize: '11px',
    fontFamily: 'var(--mono)',
  },
  '.cm-content': {
    fontFamily: 'var(--mono)',
    lineHeight: '1.625',
    padding: '10px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--subtle)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--mono)',
  },
})

type Props = {
  value: string
  language: EditorCodeLanguage
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  minHeight?: string
}

/** CodeMirror editor for theme source (Edge/HTML, CSS, JSON). */
export function ThemeEditorCodeMirror({
  value,
  language,
  onChange,
  onFocus,
  onBlur,
  className,
  minHeight = '320px',
}: Props) {
  const [scheme, setScheme] = useState(adminColorScheme)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setScheme(adminColorScheme()))
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const extensions = useMemo(
    () => [languageExtension(language), editorChrome, EditorView.lineWrapping],
    [language]
  )

  return (
    <CodeMirror
      value={value}
      height="auto"
      minHeight={minHeight}
      maxHeight="70vh"
      theme={scheme === 'dark' ? githubDark : githubLight}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        bracketMatching: true,
        autocompletion: true,
        indentOnInput: true,
        tabSize: 2,
      }}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn('text-left [&_.cm-editor]:bg-transparent', className)}
    />
  )
}
