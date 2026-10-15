import type {
  ThemeSectionSchema,
  ThemeSettingsData,
  ThemeSettingsGroup,
  ThemeTemplateData,
} from '#constants/themes'
import type { MediaUsage } from '#repositories/media_repository'

function imageKeysInSettings(
  definitions: { type: string; id?: string }[],
  settings: Record<string, unknown>
): string[] {
  const keys: string[] = []
  for (const def of definitions) {
    if (def.type !== 'image_picker' || !def.id) continue
    const value = settings[def.id]
    if (typeof value === 'string' && value && !value.startsWith('assets/')) keys.push(value)
  }
  return keys
}

function walkSectionData(
  sectionSchemas: Record<string, ThemeSectionSchema>,
  sections: Record<
    string,
    {
      type: string
      settings?: Record<string, unknown>
      blocks?: Record<string, { type: string; settings?: Record<string, unknown> }>
    }
  >,
  label: string,
  usages: Map<string, MediaUsage[]>
) {
  for (const section of Object.values(sections)) {
    const schema = sectionSchemas[section.type]
    if (!schema) continue
    for (const imageKey of imageKeysInSettings(schema.settings, section.settings ?? {})) {
      const list = usages.get(imageKey) ?? []
      list.push({ type: 'theme', label })
      usages.set(imageKey, list)
    }
    for (const block of Object.values(section.blocks ?? {})) {
      const blockSchema = schema.blocks.find((entry) => entry.type === block.type)
      if (!blockSchema) continue
      for (const imageKey of imageKeysInSettings(blockSchema.settings, block.settings ?? {})) {
        const list = usages.get(imageKey) ?? []
        list.push({ type: 'theme', label })
        usages.set(imageKey, list)
      }
    }
  }
}

/** Every gallery image referenced in theme settings or template JSON. */
export function mediaUsagesFromThemeRows(
  themeName: string,
  settingsSchema: ThemeSettingsGroup[],
  sectionSchemas: Record<string, ThemeSectionSchema>,
  settingsRows: { data: ThemeSettingsData | null; draftData: ThemeSettingsData | null }[],
  templateRows: { data: ThemeTemplateData | null; draftData: ThemeTemplateData | null }[]
): Map<string, MediaUsage[]> {
  const usages = new Map<string, MediaUsage[]>()
  const label = `Theme: ${themeName}`

  for (const row of settingsRows) {
    for (const payload of [row.data, row.draftData]) {
      if (!payload) continue
      for (const imageKey of imageKeysInSettings(
        settingsSchema.flatMap((group) => group.settings),
        payload.current ?? {}
      )) {
        const list = usages.get(imageKey) ?? []
        list.push({ type: 'theme', label })
        usages.set(imageKey, list)
      }
      walkSectionData(sectionSchemas, payload.sections ?? {}, label, usages)
    }
  }

  for (const row of templateRows) {
    for (const payload of [row.data, row.draftData]) {
      if (!payload) continue
      walkSectionData(sectionSchemas, payload.sections ?? {}, label, usages)
    }
  }

  return usages
}
