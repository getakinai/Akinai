import type { ThemeEditorData, ThemeSectionData, ThemeTemplateData } from './_editor_types'

export function newSectionId(prefix = 'section') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function newBlockId() {
  return `block_${Math.random().toString(36).slice(2, 10)}`
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
