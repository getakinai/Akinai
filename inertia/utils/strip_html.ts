/** Strip HTML tags; uses DOMParser in the browser, regex fallback elsewhere. */
export function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent ?? ''
  }
  return html.replace(/<[^>]*>/g, '')
}
