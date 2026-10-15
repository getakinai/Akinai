import sanitizeHtml from 'sanitize-html'

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'code',
    'blockquote',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
  ],
  allowedAttributes: { a: ['href', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
  },
}

const CSS_LENGTH = /^-?\d+(\.\d+)?(px|em|rem|%)?$/
const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i

/**
 * Keep in sync with `inertia/lib/sanitize_html_server.ts` (SSR sanitizer).
 *
 * Everything the back-office rich-text editor can produce (tables,
 * alignment, simple colors, images over https), minus anything that can
 * run code: scripts, event handlers, `javascript:` URLs, iframes, SVG and
 * arbitrary CSS.
 */
const EDITOR_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...(OPTIONS.allowedTags as string[]),
    'h1',
    'h5',
    'h6',
    'pre',
    'span',
    'div',
    'section',
    'article',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'img',
    'hr',
  ],
  allowedAttributes: {
    '*': ['style'],
    'a': ['href', 'rel', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    'table': ['cellpadding', 'cellspacing'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https', 'http'] },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      'color': [CSS_COLOR],
      'background-color': [CSS_COLOR],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'text-decoration': [/^(none|underline|line-through)$/],
      'padding': [CSS_LENGTH],
      'margin': [CSS_LENGTH],
      'width': [CSS_LENGTH],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
  },
}

/**
 * Staff-authored rich text reduced to a safe tag allowlist before it is
 * rendered as HTML on the storefront.
 */
export function sanitizeRichText(html: string | null): string | null {
  if (!html) return null
  const clean = sanitizeHtml(html, OPTIONS).trim()
  return clean === '' ? null : clean
}

/**
 * Rich text cleaned before it is saved, so stored HTML can't carry a
 * script to the next staff member who opens it in the editor.
 */
export function sanitizeEditorHtml(html: string | null | undefined): string | null {
  if (!html) return null
  const clean = sanitizeHtml(html, EDITOR_OPTIONS).trim()
  return clean === '' ? null : clean
}
