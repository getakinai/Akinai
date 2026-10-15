export const MAX_THEME_CSS_LENGTH = 50_000

const BANNED = /(<script\b|\0|javascript\s*:|@import\b|expression\s*\(|behavior\s*:)/i

export type ThemeCssSanitizeResult = { ok: true; css: string } | { ok: false; reason: string }

/** Sanitizes staff-authored CSS before it is stored or printed in a style tag. */
export function sanitizeThemeCss(raw: string): ThemeCssSanitizeResult {
  if (raw.length > MAX_THEME_CSS_LENGTH) {
    return { ok: false, reason: `must be at most ${MAX_THEME_CSS_LENGTH} characters` }
  }
  const css = raw.replace(/<\/style/gi, '<\\/style')
  if (BANNED.test(css)) {
    return {
      ok: false,
      reason: 'must not contain script tags, @import, javascript: URLs or CSS expressions',
    }
  }
  return { ok: true, css }
}

export function themeCssValueProblem(value: unknown): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return 'must be text'
  const result = sanitizeThemeCss(value)
  return result.ok ? null : result.reason
}

export function themeCustomCssMarkup(css: string, nonce: string): string {
  const escapedNonce = nonce.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  return `<style nonce="${escapedNonce}">${css}</style>`
}
