import type { ThemeSettingsGroup } from '#constants/themes'
import { sanitizeThemeCss, themeCustomCssMarkup } from '#theme_host/theme_css'

/** HTML for all theme `css` settings in `current`, or an empty string. */
export function buildThemeCustomCssHtml(
  settingsSchema: ThemeSettingsGroup[],
  current: Record<string, unknown>,
  nonce: string
): string {
  const chunks: string[] = []
  for (const group of settingsSchema) {
    for (const setting of group.settings) {
      if (setting.type !== 'css' || !setting.id) continue
      const value = current[setting.id]
      if (typeof value !== 'string' || !value.trim()) continue
      const sanitized = sanitizeThemeCss(value)
      if (!sanitized.ok) continue
      chunks.push(sanitized.css)
    }
  }
  if (chunks.length === 0) return ''
  return themeCustomCssMarkup(chunks.join('\n\n'), nonce)
}
