import ThemePackageException from '#exceptions/theme_package_exception'
import type {
  ThemeSectionSchema,
  ThemeSettingsData,
  ThemeSettingsGroup,
  ThemeTemplateData,
} from '#constants/themes'
import { sanitizeThemeCss } from '#theme_host/theme_css'
import { parseSettingsData, parseTemplate } from '#theme_host/schema'
function normalizeCssInCurrent(
  current: Record<string, unknown>,
  settingsSchema: ThemeSettingsGroup[]
): Record<string, unknown> {
  const cssIds = new Set<string>()
  for (const group of settingsSchema) {
    for (const setting of group.settings) {
      if (setting.type === 'css' && setting.id) cssIds.add(setting.id)
    }
  }
  if (cssIds.size === 0) return current
  const next = { ...current }
  for (const id of cssIds) {
    const value = next[id]
    if (typeof value !== 'string' || !value) continue
    const result = sanitizeThemeCss(value)
    if (result.ok) next[id] = result.css
  }
  return next
}

function normalizeSettingsPayload(data: {
  current: Record<string, unknown>
  sections: Record<string, Record<string, unknown>>
}) {
  return {
    current: data.current,
    sections: Object.fromEntries(
      Object.entries(data.sections).map(([id, section]) => [
        id,
        {
          type: section.type,
          settings: section.settings ?? {},
          blocks: section.blocks ?? {},
          block_order: (section.blockOrder ?? section.block_order ?? []) as string[],
          ...(section.disabled === true ? { disabled: true } : {}),
        },
      ])
    ),
  }
}

/** Validates draft settings before they are saved. */
export function assertValidSettingsData(
  data: unknown,
  settingsSchema: ThemeSettingsGroup[],
  sectionSchemas: Record<string, ThemeSectionSchema>,
  label = 'Theme settings'
): ThemeSettingsData {
  const problems: string[] = []
  const raw =
    data && typeof data === 'object' && 'current' in data && 'sections' in data
      ? normalizeSettingsPayload(data as any)
      : data
  const parsed = parseSettingsData(raw as any, settingsSchema, sectionSchemas, problems)
  if (problems.length > 0)
    throw new ThemePackageException(problems.map((message) => `${label}: ${message}`))
  return {
    ...parsed,
    current: normalizeCssInCurrent(parsed.current, settingsSchema),
  }
}

/** API bodies use camelCase; package JSON uses snake_case block_order. */
export function normalizeTemplatePayload(data: {
  sections: Record<string, Record<string, unknown>>
  order: string[]
}) {
  return {
    order: data.order,
    sections: Object.fromEntries(
      Object.entries(data.sections).map(([id, section]) => [
        id,
        {
          type: section.type,
          settings: section.settings ?? {},
          blocks: section.blocks ?? {},
          block_order: (section.blockOrder ?? section.block_order ?? []) as string[],
          ...(section.disabled === true ? { disabled: true } : {}),
        },
      ])
    ),
  }
}

/** Validates a draft template before it is saved. */
export function assertValidTemplateData(
  name: string,
  data: unknown,
  sectionSchemas: Record<string, ThemeSectionSchema>
): ThemeTemplateData {
  const problems: string[] = []
  const raw =
    data && typeof data === 'object' && 'sections' in data && 'order' in data
      ? normalizeTemplatePayload(data as any)
      : data
  const parsed = parseTemplate(name, raw as any, sectionSchemas, problems)
  if (problems.length > 0) {
    throw new ThemePackageException(problems.map((message) => `Template "${name}": ${message}`))
  }
  return parsed
}
