import sanitize from 'sanitize-html'

const CSS_LENGTH = /^-?\d+(\.\d+)?(px|em|rem|%)?$/
const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i

/**
 * Matches the rich-text editor allowlist the backend saves with
 * (`sanitizeEditorHtml`), so stored HTML passes through unchanged.
 */
const OPTIONS: sanitize.IOptions = {
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
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
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
    a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
  },
}

/** `sanitizeHtml()` for SSR, where DOMPurify has no DOM. Only `inertia/ssr.tsx` imports this. */
export function sanitizeHtmlOnServer(html: string): string {
  return sanitize(html, OPTIONS).trim()
}
