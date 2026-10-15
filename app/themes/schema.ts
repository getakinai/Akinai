import {
  MAX_THEME_BLOCKS_PER_SECTION,
  MAX_THEME_SECTIONS_PER_TEMPLATE,
  THEME_APP_BLOCK_TYPE,
  THEME_KEY,
  THEME_SECTION_TYPE,
  THEME_SETTING_TYPES,
  THEME_SIDEBAR_SETTING_TYPES,
  THEME_TEMPLATE_TYPES,
  type ThemeBlockData,
  type ThemeBlockSchema,
  type ThemeManifest,
  type ThemeSectionData,
  type ThemeSectionPreset,
  type ThemeSectionSchema,
  type ThemeSettingDefinition,
  type ThemeSettingType,
  type ThemeSettingsData,
  type ThemeSettingsGroup,
  type ThemeTemplateData,
  type ThemeTemplateType,
} from '#constants/themes'

/**
 * Parsers for the JSON files of a theme package. The files use Shopify's
 * snake_case keys (`max_blocks`, `block_order`); the parsed values are
 * camelCase. Every parser pushes readable problems onto `problems` and
 * returns its best-effort result, so one upload reports every mistake.
 */

type Json = unknown
type Problems = string[]

const SETTING_ID = /^[a-z0-9_]{1,60}$/
const ENTRY_ID = /^[A-Za-z0-9_-]{1,80}$/

function isBlockSchemaType(type: string) {
  return type === THEME_APP_BLOCK_TYPE || ENTRY_ID.test(type)
}

function isAppBlockSettings(settings: Record<string, unknown>, where: string, problems: Problems) {
  const plugin = settings.plugin
  const block = settings.block
  if (typeof plugin !== 'string' || !THEME_KEY.test(plugin)) {
    problems.push(`${where}: app block needs a valid "plugin" key in settings`)
    return false
  }
  if (typeof block !== 'string' || !ENTRY_ID.test(block)) {
    problems.push(`${where}: app block needs a valid "block" type in settings`)
    return false
  }
  return true
}

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalString(value: Json, max: number): string | undefined {
  return typeof value === 'string' && value.length <= max ? value : undefined
}

export function parseManifest(raw: Json, problems: Problems): ThemeManifest | null {
  if (!isRecord(raw)) {
    problems.push('theme.json must be a JSON object')
    return null
  }
  const key = typeof raw.key === 'string' ? raw.key : ''
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const version = typeof raw.version === 'string' ? raw.version.trim() : ''
  if (!THEME_KEY.test(key)) {
    problems.push('theme.json: "key" must be 1-60 lowercase letters, digits or underscores')
  }
  if (!name || name.length > 120) problems.push('theme.json: "name" is required (max 120)')
  if (!/^[0-9A-Za-z.+-]{1,40}$/.test(version)) {
    problems.push('theme.json: "version" is required, for example "1.0.0"')
  }
  const previewImage = optionalString(raw.preview_image, 255) ?? null
  if (previewImage && !/^(assets\/)?[A-Za-z0-9_./-]+\.(png|jpe?g|webp)$/.test(previewImage)) {
    problems.push('theme.json: "preview_image" must be a PNG, JPG or WebP file in the package')
  }
  return {
    key,
    name,
    version,
    author: optionalString(raw.author, 120) ?? null,
    description: optionalString(raw.description, 500) ?? null,
    previewImage,
  }
}

function parseSetting(raw: Json, where: string, problems: Problems): ThemeSettingDefinition | null {
  if (!isRecord(raw)) {
    problems.push(`${where}: each setting must be an object`)
    return null
  }
  const type = raw.type as ThemeSettingType
  if (!THEME_SETTING_TYPES.includes(type)) {
    problems.push(`${where}: unknown setting type "${String(raw.type)}"`)
    return null
  }
  const setting: ThemeSettingDefinition = { type }
  if (!THEME_SIDEBAR_SETTING_TYPES.includes(type)) {
    if (typeof raw.id !== 'string' || !SETTING_ID.test(raw.id)) {
      problems.push(`${where}: "${type}" settings need an "id" of lowercase letters, digits or _`)
      return null
    }
    setting.id = raw.id
  }
  setting.label = optionalString(raw.label, 120)
  setting.info = optionalString(raw.info, 500)
  setting.content = optionalString(raw.content, 500)
  setting.placeholder = optionalString(raw.placeholder, 120)
  setting.unit = optionalString(raw.unit, 10)
  for (const key of ['min', 'max', 'step'] as const) {
    if (typeof raw[key] === 'number') setting[key] = raw[key]
  }
  if (type === 'select' || type === 'radio') {
    const options = Array.isArray(raw.options) ? raw.options : []
    setting.options = options
      .filter(isRecord)
      .filter((option) => typeof option.value === 'string')
      .map((option) => ({
        value: option.value as string,
        label: typeof option.label === 'string' ? option.label : (option.value as string),
      }))
    if (setting.options.length === 0) {
      problems.push(`${where}: "${setting.id}" needs at least one option`)
    }
  }
  if (type === 'range' && (setting.min === undefined || setting.max === undefined)) {
    problems.push(`${where}: range "${setting.id}" needs "min" and "max"`)
  }
  if (raw.default !== undefined) {
    const error = settingValueProblem(setting, raw.default)
    if (error) problems.push(`${where}: default of "${setting.id}" ${error}`)
    else setting.default = raw.default
  }
  return setting
}

function parseSettings(raw: Json, where: string, problems: Problems): ThemeSettingDefinition[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    problems.push(`${where}: "settings" must be a list`)
    return []
  }
  const settings = raw
    .map((entry) => parseSetting(entry, where, problems))
    .filter((setting): setting is ThemeSettingDefinition => setting !== null)
  const seen = new Set<string>()
  for (const setting of settings) {
    if (!setting.id) continue
    if (seen.has(setting.id)) problems.push(`${where}: setting id "${setting.id}" is used twice`)
    seen.add(setting.id)
  }
  return settings
}

/** `config/settings_schema.json`. A `theme_info` group (Shopify) is ignored. */
export function parseSettingsSchema(raw: Json, problems: Problems): ThemeSettingsGroup[] {
  const where = 'config/settings_schema.json'
  if (!Array.isArray(raw)) {
    problems.push(`${where} must be a list of setting groups`)
    return []
  }
  const groups = raw
    .filter((group) => !(isRecord(group) && group.name === 'theme_info'))
    .map((group) => {
      if (!isRecord(group) || typeof group.name !== 'string') {
        problems.push(`${where}: each group needs a "name"`)
        return null
      }
      return { name: group.name, settings: parseSettings(group.settings, where, problems) }
    })
    .filter((group): group is ThemeSettingsGroup => group !== null)
  const seen = new Set<string>()
  for (const setting of groups.flatMap((group) => group.settings)) {
    if (!setting.id) continue
    if (seen.has(setting.id)) problems.push(`${where}: setting id "${setting.id}" is used twice`)
    seen.add(setting.id)
  }
  return groups
}

/** `sections/<type>.schema.json`; a section without one has no settings. */
export function parseSectionSchema(
  type: string,
  raw: Json | undefined,
  problems: Problems
): ThemeSectionSchema {
  const where = `sections/${type}.schema.json`
  if (raw === undefined) {
    return { name: type, settings: [], blocks: [], presets: [], enabledOn: null }
  }
  if (!isRecord(raw)) {
    problems.push(`${where} must be a JSON object`)
    return { name: type, settings: [], blocks: [], presets: [], enabledOn: null }
  }
  const blocks: ThemeBlockSchema[] = (Array.isArray(raw.blocks) ? raw.blocks : [])
    .map((block): ThemeBlockSchema | null => {
      if (!isRecord(block) || typeof block.type !== 'string' || !isBlockSchemaType(block.type)) {
        problems.push(`${where}: each block needs a "type"`)
        return null
      }
      return {
        type: block.type,
        name: typeof block.name === 'string' ? block.name : block.type,
        limit: typeof block.limit === 'number' ? block.limit : undefined,
        settings: parseSettings(block.settings, `${where} block "${block.type}"`, problems),
      }
    })
    .filter((block): block is ThemeBlockSchema => block !== null)

  const presets: ThemeSectionPreset[] = (Array.isArray(raw.presets) ? raw.presets : [])
    .filter(isRecord)
    .map((preset) => ({
      name: typeof preset.name === 'string' ? preset.name : type,
      settings: isRecord(preset.settings) ? preset.settings : undefined,
      blocks: Array.isArray(preset.blocks)
        ? preset.blocks.filter(isRecord).map((block) => ({
            type: String(block.type),
            settings: isRecord(block.settings) ? block.settings : undefined,
          }))
        : undefined,
    }))

  let enabledOn: ThemeTemplateType[] | null = null
  if (isRecord(raw.enabled_on) && Array.isArray(raw.enabled_on.templates)) {
    enabledOn = raw.enabled_on.templates.filter((template): template is ThemeTemplateType =>
      THEME_TEMPLATE_TYPES.includes(template as ThemeTemplateType)
    )
  }

  return {
    name: typeof raw.name === 'string' ? raw.name : type,
    settings: parseSettings(raw.settings, where, problems),
    blocks,
    maxBlocks:
      typeof raw.max_blocks === 'number'
        ? Math.min(raw.max_blocks, MAX_THEME_BLOCKS_PER_SECTION)
        : undefined,
    presets,
    enabledOn,
  }
}

function parseSectionData(
  raw: Json,
  where: string,
  schemas: Record<string, ThemeSectionSchema>,
  problems: Problems
): ThemeSectionData | null {
  if (!isRecord(raw) || typeof raw.type !== 'string' || !THEME_SECTION_TYPE.test(raw.type)) {
    problems.push(`${where}: each section needs a "type"`)
    return null
  }
  const schema = schemas[raw.type]
  if (!schema) {
    problems.push(`${where}: section type "${raw.type}" has no sections/${raw.type}.edge`)
    return null
  }
  const settings = isRecord(raw.settings) ? raw.settings : {}
  problems.push(...settingsProblems(schema.settings, settings).map((error) => `${where}: ${error}`))

  const blocks: Record<string, ThemeBlockData> = {}
  if (isRecord(raw.blocks)) {
    for (const [id, block] of Object.entries(raw.blocks)) {
      if (!ENTRY_ID.test(id) || !isRecord(block) || typeof block.type !== 'string') {
        problems.push(`${where}: block "${id}" needs a "type"`)
        continue
      }
      const blockSchema = schema.blocks.find((entry) => entry.type === block.type)
      if (!blockSchema) {
        problems.push(`${where}: section "${raw.type}" has no block type "${block.type}"`)
        continue
      }
      const blockSettings = isRecord(block.settings) ? block.settings : {}
      if (block.type === THEME_APP_BLOCK_TYPE) {
        isAppBlockSettings(blockSettings, `${where} block "${id}"`, problems)
      } else {
        problems.push(
          ...settingsProblems(blockSchema.settings, blockSettings).map(
            (error) => `${where} block "${id}": ${error}`
          )
        )
      }
      blocks[id] = {
        type: block.type,
        settings: blockSettings,
        ...(block.disabled === true ? { disabled: true } : {}),
      }
    }
  }
  const blockOrder = Array.isArray(raw.block_order)
    ? raw.block_order.filter((id): id is string => typeof id === 'string' && id in blocks)
    : Object.keys(blocks)
  const limit = schema.maxBlocks ?? MAX_THEME_BLOCKS_PER_SECTION
  if (blockOrder.length > limit) {
    problems.push(`${where}: section "${raw.type}" allows at most ${limit} blocks`)
  }

  return {
    type: raw.type,
    settings,
    blocks,
    blockOrder,
    ...(raw.disabled === true ? { disabled: true } : {}),
  }
}

/** `templates/<name>.json`. */
export function parseTemplate(
  name: string,
  raw: Json,
  schemas: Record<string, ThemeSectionSchema>,
  problems: Problems
): ThemeTemplateData {
  const where = `templates/${name}.json`
  if (!isRecord(raw) || !isRecord(raw.sections)) {
    problems.push(`${where} needs a "sections" object`)
    return { sections: {}, order: [] }
  }
  const type = name.split('.')[0] as ThemeTemplateType
  const sections: Record<string, ThemeSectionData> = {}
  for (const [id, section] of Object.entries(raw.sections)) {
    if (!ENTRY_ID.test(id)) {
      problems.push(`${where}: section id "${id}" may only use letters, digits, - and _`)
      continue
    }
    const parsed = parseSectionData(section, `${where} section "${id}"`, schemas, problems)
    if (!parsed) continue
    const enabledOn = schemas[parsed.type].enabledOn
    if (enabledOn && !enabledOn.includes(type)) {
      problems.push(`${where}: section "${parsed.type}" can't be used on ${type} templates`)
    }
    sections[id] = parsed
  }
  const order = Array.isArray(raw.order)
    ? raw.order.filter((id): id is string => typeof id === 'string' && id in sections)
    : Object.keys(sections)
  if (order.length > MAX_THEME_SECTIONS_PER_TEMPLATE) {
    problems.push(`${where}: at most ${MAX_THEME_SECTIONS_PER_TEMPLATE} sections`)
  }
  return { sections, order }
}

/** `config/settings_data.json`: saved theme settings plus static section data. */
export function parseSettingsData(
  raw: Json | undefined,
  settingsSchema: ThemeSettingsGroup[],
  schemas: Record<string, ThemeSectionSchema>,
  problems: Problems
): ThemeSettingsData {
  const where = 'config/settings_data.json'
  if (raw === undefined) return { current: {}, sections: {} }
  if (!isRecord(raw)) {
    problems.push(`${where} must be a JSON object`)
    return { current: {}, sections: {} }
  }
  const current = isRecord(raw.current) ? raw.current : {}
  const definitions = settingsSchema.flatMap((group) => group.settings)
  problems.push(...settingsProblems(definitions, current).map((error) => `${where}: ${error}`))

  const sections: Record<string, ThemeSectionData> = {}
  if (isRecord(raw.sections)) {
    for (const [id, section] of Object.entries(raw.sections)) {
      const parsed = parseSectionData(section, `${where} section "${id}"`, schemas, problems)
      if (parsed) sections[id] = parsed
    }
  }
  return { current, sections }
}

/** Why `value` doesn't fit `setting`, or null when it does. */
export function settingValueProblem(setting: ThemeSettingDefinition, value: Json): string | null {
  if (value === null) return null
  switch (setting.type) {
    case 'checkbox':
      return typeof value === 'boolean' ? null : 'must be true or false'
    case 'number':
    case 'range': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'must be a number'
      if (setting.min !== undefined && value < setting.min) return `must be at least ${setting.min}`
      if (setting.max !== undefined && value > setting.max) return `must be at most ${setting.max}`
      return null
    }
    case 'select':
    case 'radio':
      return setting.options?.some((option) => option.value === value)
        ? null
        : 'must be one of its options'
    case 'color':
      return typeof value === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value)
        ? null
        : 'must be a hex color like #1a2b3c'
    case 'url':
      return typeof value === 'string' && /^(\/(?!\/)|https?:\/\/|mailto:|tel:|#)/.test(value)
        ? null
        : 'must be a path, http(s) URL, mailto: or tel: link'
    case 'header':
    case 'paragraph':
      return null
    default:
      return typeof value === 'string' && value.length <= 20000 ? null : 'must be text'
  }
}

/** Problems with saved values, keyed by setting id. Unknown ids are ignored. */
export function settingsProblems(
  definitions: ThemeSettingDefinition[],
  values: Record<string, Json>
): string[] {
  const problems: string[] = []
  for (const setting of definitions) {
    if (!setting.id || !(setting.id in values)) continue
    const error = settingValueProblem(setting, values[setting.id])
    if (error) problems.push(`"${setting.id}" ${error}`)
  }
  return problems
}
