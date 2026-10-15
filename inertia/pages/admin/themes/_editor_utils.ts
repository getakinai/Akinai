import type {
  ThemeEditorData,
  ThemeSectionData,
  ThemeSettingsData,
  ThemeTemplateData,
} from './_editor_types'

/** Human-readable label for a template file name (e.g. `index` → Homepage). */
export function templateDisplayName(templateName: string): string {
  const base = templateName.split('.')[0]
  if (base === 'index') return 'Homepage'
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** Accept Shopify-style `block_order` in pasted template JSON. */
export function normalizeTemplateJsonPayload(data: {
  sections: Record<string, Record<string, unknown>>
  order: string[]
}) {
  return {
    order: data.order,
    sections: Object.fromEntries(
      Object.entries(data.sections).map(([id, section]) => [
        id,
        {
          ...section,
          blockOrder: (section.blockOrder ?? section.block_order ?? []) as string[],
        },
      ])
    ),
  }
}

export function editorCodePaths(
  settings: ThemeSettingsData,
  template: ThemeTemplateData,
  templateName: string
): string[] {
  const paths = new Set<string>([
    'layout/theme.edge',
    'assets/base.css',
    `templates/${templateName}.json`,
  ])
  for (const section of Object.values(settings.sections)) {
    paths.add(`sections/${section.type}.edge`)
  }
  for (const section of Object.values(template.sections)) {
    paths.add(`sections/${section.type}.edge`)
  }
  return [...paths].sort()
}

export function newSectionId(prefix = 'section') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function newBlockId() {
  return `block_${Math.random().toString(36).slice(2, 10)}`
}

export function sectionThemeSourcePath(sectionType: string): string {
  return `sections/${sectionType}.edge`
}

export function sectionTypesForTemplate(
  data: ThemeEditorData,
  templateName: string
): { type: string; name: string }[] {
  const templateType = templateName.split('.')[0]
  return Object.entries(data.sectionSchemas)
    .filter(([, schema]) => !schema.enabledOn || schema.enabledOn.includes(templateType))
    .map(([type, schema]) => ({ type, name: schema.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function sectionFromPreset(
  type: string,
  schema: ThemeEditorData['sectionSchemas'][string]
): ThemeSectionData {
  const preset = schema.presets[0]
  const blocks: NonNullable<ThemeSectionData['blocks']> = {}
  const blockOrder: string[] = []
  if (preset?.blocks) {
    for (const block of preset.blocks) {
      const id = newBlockId()
      blocks[id] = {
        type: block.type,
        settings: { ...(block.settings ?? {}) },
      }
      blockOrder.push(id)
    }
  }
  return {
    type,
    settings: { ...(preset?.settings ?? {}) },
    blocks,
    blockOrder,
  }
}

type SectionBlock = {
  type: string
  settings?: Record<string, unknown>
  disabled?: boolean
}

function asBlockData(value: unknown): SectionBlock {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    throw new Error('Invalid block data')
  }
  const block = value as SectionBlock
  return {
    type: block.type,
    settings: { ...(block.settings ?? {}) },
    ...(block.disabled ? { disabled: true } : {}),
  }
}

export function duplicateSection(section: ThemeSectionData): ThemeSectionData {
  const blocks: NonNullable<ThemeSectionData['blocks']> = {}
  const blockOrder: string[] = []
  for (const id of section.blockOrder ?? Object.keys(section.blocks ?? {})) {
    const block = section.blocks?.[id]
    if (!block) continue
    const nextId = newBlockId()
    blocks[nextId] = asBlockData(block)
    blockOrder.push(nextId)
  }
  return {
    type: section.type,
    settings: { ...(section.settings ?? {}) },
    blocks,
    blockOrder,
    disabled: section.disabled,
  }
}

export function countBlocksOfType(section: ThemeSectionData, blockType: string) {
  return Object.values(section.blocks ?? {}).filter((block) => {
    return (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      (block as { type: string }).type === blockType
    )
  }).length
}

export function blockTypeLimit(
  schema: ThemeEditorData['sectionSchemas'][string],
  blockType: string
): number | undefined {
  const def = schema.blocks.find((block) => block.type === blockType)
  return def?.limit
}

export function canAddBlockType(
  section: ThemeSectionData,
  schema: ThemeEditorData['sectionSchemas'][string],
  blockType: string
) {
  const limit = blockTypeLimit(schema, blockType)
  if (limit === undefined) return true
  return countBlocksOfType(section, blockType) < limit
}

export function staticSectionIds(settings: { sections: Record<string, unknown> }) {
  return Object.keys(settings.sections ?? {})
}

export function templateRefreshSectionIds(template: ThemeTemplateData) {
  return template.order
}
