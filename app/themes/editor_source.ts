/** Theme package paths staff may read from the editor (read-only). */
const EDITOR_SOURCE_PATH =
  /^(?:sections|blocks|snippets|layout|templates|assets)\/[a-z0-9_.-]+\.(?:edge|json|css)$|^config\/settings_schema\.json$/

export function normalizeEditorSourcePath(raw: string): string | null {
  const path = raw.replace(/\\/g, '/').replace(/^\/+/, '').trim()
  if (!path || path.includes('..') || !EDITOR_SOURCE_PATH.test(path)) return null
  return path
}

export function sectionThemeSourcePath(sectionType: string): string {
  return `sections/${sectionType}.edge`
}
