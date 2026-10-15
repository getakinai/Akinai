import { Marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

const marked = new Marked({ gfm: true, async: false })

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'code',
    'pre',
    'blockquote',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: { a: ['href', 'rel'] },
  allowedSchemes: ['https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

export type RenderedHelpMarkdown = { html: string; text: string; paragraphs: string[] }

const BLOCK_END = /<\/(?:p|li|h2|h3|h4|blockquote|td|th|pre)>/

/**
 * Help articles are written by staff in the back office, so the HTML is
 * reduced to a small allowlist before it is stored or previewed.
 * `paragraphs` holds the plain text of each block (paragraph, list item,
 * heading), which the help chat quotes from.
 */
export function renderHelpMarkdown(markdown: string): RenderedHelpMarkdown {
  const html = sanitizeHtml(marked.parse(markdown) as string, OPTIONS).trim()
  const text = toPlainText(html)
  const paragraphs = html
    .split(BLOCK_END)
    .map(toPlainText)
    .filter((block) => block.length > 0)
  return { html, text, paragraphs }
}

function toPlainText(html: string): string {
  return decodeEntities(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }))
    .replace(/\s+/g, ' ')
    .trim()
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
}
