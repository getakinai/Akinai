/** True when the string looks like HTML (not plain text with newlines). */
export function isHtmlEmailBody(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return /<\/?[a-z][\s\S]*>/i.test(trimmed)
}
