/** `live` is the theme shoppers see. At most one theme is live. */
export const THEME_ROLES = ['live', 'unpublished'] as const

export type ThemeRole = (typeof THEME_ROLES)[number]

/** `bundled` themes ship in `themes/<key>/`; `upload` themes came from a zip. */
export const THEME_SOURCES = ['bundled', 'upload'] as const

export type ThemeSource = (typeof THEME_SOURCES)[number]

/**
 * Storefront pages a theme can render. A JSON template is named after its
 * type, optionally with a suffix (`page.contact`).
 */
export const THEME_TEMPLATE_TYPES = ['index', 'product', 'collection', 'page'] as const

export type ThemeTemplateType = (typeof THEME_TEMPLATE_TYPES)[number]

export const THEME_TEMPLATE_NAME = /^(index|product|collection|page)(\.[a-z0-9_-]{1,40})?$/

export const THEME_SECTION_TYPE = /^[a-z0-9_-]{1,60}$/

export const THEME_KEY = /^[a-z0-9_]{1,60}$/

export const THEME_SETTING_TYPES = [
  'text',
  'textarea',
  'richtext',
  'url',
  'checkbox',
  'number',
  'range',
  'select',
  'radio',
  'color',
  'image_picker',
  'product',
  'collection',
  'page',
  'link_list',
  'header',
  'paragraph',
] as const

export type ThemeSettingType = (typeof THEME_SETTING_TYPES)[number]

/** Types that only label the editor form and hold no value. */
export const THEME_SIDEBAR_SETTING_TYPES: readonly ThemeSettingType[] = ['header', 'paragraph']

export const MAX_THEME_PACKAGE_MB = 10
export const MAX_THEME_UNPACKED_MB = 30
export const MAX_THEME_FILES = 500
export const MAX_THEME_SECTIONS_PER_TEMPLATE = 40
export const MAX_THEME_BLOCKS_PER_SECTION = 50

/** Files a theme package may contain. Scripts are never accepted. */
export const THEME_FILE_EXTENSIONS = [
  'edge',
  'json',
  'css',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'svg',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'otf',
] as const

export const THEME_ASSET_CONTENT_TYPES: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
}

/**
 * Edge templates compile to JavaScript and are not sandboxed. Templates that
 * mention any of these are rejected, which blocks the known ways out of the
 * template state into Node globals.
 */
export const THEME_BANNED_TEMPLATE_PATTERNS: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /constructor/, label: 'constructor' },
  { pattern: /__proto__/, label: '__proto__' },
  { pattern: /prototype/, label: 'prototype' },
  { pattern: /\bprocess\b/, label: 'process' },
  { pattern: /\brequire\b/, label: 'require' },
  { pattern: /\bimport\s*\(/, label: 'import()' },
  { pattern: /\bglobalThis\b/, label: 'globalThis' },
  { pattern: /\bglobal\b/, label: 'global' },
  { pattern: /\bFunction\b/, label: 'Function' },
  { pattern: /\beval\b/, label: 'eval' },
  { pattern: /\bReflect\b/, label: 'Reflect' },
  { pattern: /\bProxy\b/, label: 'Proxy' },
  { pattern: /@(eval|inject|debugger)\b/, label: 'unsupported tag' },
  { pattern: /::/, label: 'disk prefix' },
]

/** How long a shared theme preview link works. */
export const THEME_SHARE_PREVIEW_EXPIRES_IN = '14 days'

/** Drive folder (private disk) holding uploaded theme packages. */
export const THEME_DRIVE_FOLDER = 'themes'

export type ThemeManifest = {
  key: string
  name: string
  version: string
  author: string | null
  description: string | null
  previewImage: string | null
}

export type ThemeSettingDefinition = {
  type: ThemeSettingType
  id?: string
  label?: string
  info?: string
  content?: string
  default?: unknown
  placeholder?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  unit?: string
}

export type ThemeSettingsGroup = {
  name: string
  settings: ThemeSettingDefinition[]
}

export type ThemeBlockSchema = {
  type: string
  name: string
  limit?: number
  settings: ThemeSettingDefinition[]
}

export type ThemeSectionPreset = {
  name: string
  settings?: Record<string, unknown>
  blocks?: { type: string; settings?: Record<string, unknown> }[]
}

export type ThemeSectionSchema = {
  name: string
  settings: ThemeSettingDefinition[]
  blocks: ThemeBlockSchema[]
  maxBlocks?: number
  presets: ThemeSectionPreset[]
  enabledOn: ThemeTemplateType[] | null
}

export type ThemeBlockData = {
  type: string
  settings: Record<string, unknown>
  disabled?: boolean
}

export type ThemeSectionData = {
  type: string
  settings: Record<string, unknown>
  blocks: Record<string, ThemeBlockData>
  blockOrder: string[]
  disabled?: boolean
}

/** A JSON template: which sections a page shows, and in what order. */
export type ThemeTemplateData = {
  sections: Record<string, ThemeSectionData>
  order: string[]
}

/** `current` holds theme settings; `sections` holds static sections (header, footer). */
export type ThemeSettingsData = {
  current: Record<string, unknown>
  sections: Record<string, ThemeSectionData>
}
