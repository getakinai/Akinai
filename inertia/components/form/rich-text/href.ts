/** Allow relative app paths, fragments, and http(s)/mailto URLs only. */
export function sanitizeRichTextHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }
  if (trimmed.startsWith('#')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    ) {
      return parsed.toString()
    }
  } catch {
    return ''
  }

  return ''
}

export function isAbsoluteHttpUrl(text: string): boolean {
  try {
    const parsed = new URL(text.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
