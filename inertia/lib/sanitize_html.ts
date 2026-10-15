import DOMPurify from 'dompurify'

let serverSanitizer: ((html: string) => string) | null = null

/**
 * The sanitizer used during SSR, where DOMPurify has no DOM. Set by
 * `inertia/ssr.tsx` so the browser bundle never loads it.
 */
export function setServerSanitizer(sanitize: (html: string) => string) {
  serverSanitizer = sanitize
}

/**
 * Cleans raw HTML before it is injected with `dangerouslySetInnerHTML`:
 * scripts, event handlers, `javascript:` URLs, iframes and SVG are removed.
 * During SSR it uses the server sanitizer, or returns an empty string when
 * none is set.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return serverSanitizer ? serverSanitizer(html) : ''
  if (!DOMPurify.isSupported) return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'svg', 'math', 'object', 'embed'],
    FORBID_ATTR: ['srcset'],
  })
}
