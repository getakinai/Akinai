/** Strip HTML tags; uses DOMParser in the browser, regex fallback elsewhere. */
export function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent ?? ''
  }

  let current = html
  let previous: string
  do {
    previous = current
    current = current.replace(/<[^>]*>/g, '')
  } while (current !== previous)

  return current
}
