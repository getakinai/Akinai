import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { strFromU8, unzipSync, zipSync } from 'fflate'
import ThemePackageException from '#exceptions/theme_package_exception'
import {
  MAX_THEME_FILES,
  MAX_THEME_UNPACKED_MB,
  THEME_BANNED_TEMPLATE_PATTERNS,
  THEME_FILE_EXTENSIONS,
  THEME_SECTION_TYPE,
  THEME_TEMPLATE_NAME,
  type ThemeManifest,
  type ThemeSectionSchema,
  type ThemeSettingsData,
  type ThemeSettingsGroup,
  type ThemeTemplateData,
} from '#constants/themes'
import {
  parseManifest,
  parseSectionSchema,
  parseSettingsData,
  parseSettingsSchema,
  parseTemplate,
} from '#theme_host/schema'

export type ThemeFiles = Record<string, Uint8Array>

export type ThemePackage = {
  manifest: ThemeManifest
  settingsSchema: ThemeSettingsGroup[]
  settingsData: ThemeSettingsData
  sectionSchemas: Record<string, ThemeSectionSchema>
  templates: Record<string, ThemeTemplateData>
  files: ThemeFiles
  hash: string
}

const SAFE_PATH = /^[A-Za-z0-9_][A-Za-z0-9_.-]*(\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/

/** Where each kind of file may live, Shopify-style. */
const FILE_RULES: { pattern: RegExp; extensions: readonly string[] }[] = [
  { pattern: /^theme\.json$/, extensions: ['json'] },
  { pattern: /^[^/]+$/, extensions: ['png', 'jpg', 'jpeg', 'webp'] },
  { pattern: /^layout\/[^/]+$/, extensions: ['edge'] },
  { pattern: /^templates\/[^/]+$/, extensions: ['json'] },
  { pattern: /^sections\/[^/]+$/, extensions: ['edge', 'json'] },
  { pattern: /^snippets\/.+$/, extensions: ['edge'] },
  { pattern: /^config\/settings_(schema|data)\.json$/, extensions: ['json'] },
  { pattern: /^locales\/[^/]+$/, extensions: ['json'] },
  { pattern: /^assets\/.+$/, extensions: THEME_FILE_EXTENSIONS.filter((ext) => ext !== 'edge') },
]

/** Edge tags a theme may use. Anything else (`@inject`, custom tags) is rejected. */
const ALLOWED_TAGS = new Set([
  'if',
  'elseif',
  'else',
  'unless',
  'each',
  'end',
  'let',
  'assign',
  'include',
  'includeIf',
  'component',
  'slot',
])

/** A tag with arguments after other content on the same line, e.g. `<li>@include('card')</li>`. */
const INLINE_TAG =
  /\S[^\n]*?(?<![\w@])@!?(include|includeIf|if|elseif|unless|each|let|assign|component|slot)\s*\(/

function extension(path: string) {
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : path.slice(dot + 1).toLowerCase()
}

function isIgnored(path: string) {
  return (
    path.startsWith('__MACOSX/') ||
    path.split('/').some((segment) => segment.startsWith('.')) ||
    path.endsWith('/')
  )
}

/**
 * Zips made by "Compress folder" wrap everything in one top folder. That
 * folder is dropped when `theme.json` isn't at the root.
 */
function stripWrapperFolder(paths: string[]): string {
  if (paths.includes('theme.json')) return ''
  const tops = new Set(paths.map((path) => path.split('/')[0]))
  if (tops.size !== 1) return ''
  const [top] = [...tops]
  return paths.includes(`${top}/theme.json`) ? `${top}/` : ''
}

/** Expressions and tag arguments of an Edge template, without comments or escaped output. */
function templateCode(source: string): { code: string[]; tags: string[] } {
  const stripped = source
    .replace(/\{\{--[\s\S]*?--\}\}/g, '')
    .replace(/@\{\{[\s\S]*?\}\}/g, '')
    .replace(/^\s*@@.*$/gm, '')
  const code = [...stripped.matchAll(/\{\{\{?([\s\S]*?)\}?\}\}/g)].map((match) => match[1])
  const tags: string[] = []
  for (const match of stripped.matchAll(/^[ \t]*@!?([A-Za-z_]+)/gm)) {
    tags.push(match[1])
    let index = (match.index ?? 0) + match[0].length
    while (stripped[index] === ' ' || stripped[index] === '\t') index++
    if (stripped[index] !== '(') continue
    let depth = 0
    const start = index
    for (; index < stripped.length; index++) {
      if (stripped[index] === '(') depth++
      else if (stripped[index] === ')' && --depth === 0) break
    }
    code.push(stripped.slice(start + 1, index))
  }
  return { code, tags }
}

const MAX_EDITOR_SOURCE_BYTES = 512 * 1024

/** Validates a single theme template file before saving an editor draft. */
export function validateThemeSourceFile(path: string, content: string): string[] {
  const problems: string[] = []
  const bytes = new TextEncoder().encode(content)
  if (bytes.length > MAX_EDITOR_SOURCE_BYTES) {
    problems.push(`${path}: file is too large (max ${MAX_EDITOR_SOURCE_BYTES / 1024} KB)`)
  }
  const ext = extension(path)
  if (ext === 'edge') problems.push(...templateProblems(path, content))
  if (ext === 'json') {
    try {
      JSON.parse(content)
    } catch {
      problems.push(`${path} is not valid JSON`)
    }
  }
  return problems
}

function templateProblems(path: string, source: string): string[] {
  const problems: string[] = []
  const { code, tags } = templateCode(source)
  for (const tag of new Set(tags)) {
    if (!ALLOWED_TAGS.has(tag)) problems.push(`${path}: the @${tag} tag isn't allowed in themes`)
  }
  const joined = code.join('\n')
  for (const { pattern, label } of THEME_BANNED_TEMPLATE_PATTERNS) {
    if (pattern.test(joined)) problems.push(`${path}: "${label}" isn't allowed in theme templates`)
  }
  if (/\.\.\//.test(joined)) problems.push(`${path}: paths may not contain "../"`)
  source.split('\n').forEach((line, index) => {
    const inline = line.match(INLINE_TAG)
    if (inline) {
      problems.push(
        `${path} line ${index + 1}: put @${inline[1]} on its own line; Edge prints tags that share a line as text`
      )
    }
  })
  return problems
}

function parseJson(path: string, bytes: Uint8Array, problems: string[]): unknown {
  try {
    return JSON.parse(strFromU8(bytes))
  } catch {
    problems.push(`${path} is not valid JSON`)
    return undefined
  }
}

/**
 * Unzips and validates a theme package. Throws `ThemePackageException`
 * listing every problem; never writes to disk.
 */
export function readThemePackage(zip: Uint8Array): ThemePackage {
  const problems: string[] = []
  let declaredBytes = 0
  let entries = 0
  let raw: ThemeFiles
  try {
    raw = unzipSync(zip, {
      filter: (file) => {
        if (isIgnored(file.name)) return false
        entries++
        declaredBytes += file.originalSize
        return entries <= MAX_THEME_FILES && declaredBytes <= MAX_THEME_UNPACKED_MB * 1024 * 1024
      },
    })
  } catch {
    throw new ThemePackageException(['The file is not a valid zip archive'])
  }
  if (entries > MAX_THEME_FILES) {
    throw new ThemePackageException([`A theme may contain at most ${MAX_THEME_FILES} files`])
  }
  const actualBytes = Object.values(raw).reduce((total, bytes) => total + bytes.length, 0)
  if (declaredBytes > MAX_THEME_UNPACKED_MB * 1024 * 1024 || actualBytes > declaredBytes) {
    throw new ThemePackageException([`A theme may unpack to at most ${MAX_THEME_UNPACKED_MB} MB`])
  }

  const prefix = stripWrapperFolder(Object.keys(raw))
  const files: ThemeFiles = {}
  for (const [name, bytes] of Object.entries(raw)) {
    if (!name.startsWith(prefix)) {
      problems.push(`${name}: every file must be inside the theme folder`)
      continue
    }
    const path = name.slice(prefix.length)
    if (path.length > 200 || !SAFE_PATH.test(path)) {
      problems.push(`${path}: file names may only use letters, digits, ".", "-" and "_"`)
      continue
    }
    const rule = FILE_RULES.find((entry) => entry.pattern.test(path))
    if (!rule || !rule.extensions.includes(extension(path))) {
      problems.push(`${path}: this file type isn't allowed here`)
      continue
    }
    files[path] = bytes
  }

  for (const [path, bytes] of Object.entries(files)) {
    if (extension(path) === 'edge') problems.push(...templateProblems(path, strFromU8(bytes)))
  }

  const manifestBytes = files['theme.json']
  const manifest = manifestBytes
    ? parseManifest(parseJson('theme.json', manifestBytes, problems), problems)
    : null
  if (!manifestBytes) problems.push('theme.json is missing')
  if (!files['layout/theme.edge']) problems.push('layout/theme.edge is missing')
  if (!files['templates/index.json']) problems.push('templates/index.json is missing')
  if (manifest?.previewImage && !files[manifest.previewImage]) {
    problems.push(`theme.json: preview image "${manifest.previewImage}" is not in the package`)
  }

  const sectionSchemas: Record<string, ThemeSectionSchema> = {}
  for (const path of Object.keys(files)) {
    const match = path.match(/^sections\/(.+)\.edge$/)
    if (!match) continue
    if (!THEME_SECTION_TYPE.test(match[1])) {
      problems.push(`${path}: section names may only use lowercase letters, digits, - and _`)
      continue
    }
    const schemaPath = `sections/${match[1]}.schema.json`
    const schemaJson = files[schemaPath]
      ? parseJson(schemaPath, files[schemaPath], problems)
      : undefined
    sectionSchemas[match[1]] = parseSectionSchema(match[1], schemaJson, problems)
  }
  for (const path of Object.keys(files)) {
    const match = path.match(/^sections\/(.+)\.schema\.json$/)
    if (match && !sectionSchemas[match[1]])
      problems.push(`${path} has no sections/${match[1]}.edge`)
    if (/^sections\/.+\.json$/.test(path) && !match) {
      problems.push(`${path}: section schemas are named <section>.schema.json`)
    }
  }

  const settingsSchemaPath = 'config/settings_schema.json'
  const settingsSchema = files[settingsSchemaPath]
    ? parseSettingsSchema(
        parseJson(settingsSchemaPath, files[settingsSchemaPath], problems),
        problems
      )
    : []
  const settingsDataPath = 'config/settings_data.json'
  const settingsData = parseSettingsData(
    files[settingsDataPath]
      ? parseJson(settingsDataPath, files[settingsDataPath], problems)
      : undefined,
    settingsSchema,
    sectionSchemas,
    problems
  )

  const templates: Record<string, ThemeTemplateData> = {}
  for (const path of Object.keys(files)) {
    const match = path.match(/^templates\/(.+)\.json$/)
    if (!match) continue
    if (!THEME_TEMPLATE_NAME.test(match[1])) {
      problems.push(
        `${path}: templates are index, product, collection or page, optionally with a suffix like page.contact`
      )
      continue
    }
    templates[match[1]] = parseTemplate(
      match[1],
      parseJson(path, files[path], problems),
      sectionSchemas,
      problems
    )
  }

  for (const path of Object.keys(files)) {
    if (path.startsWith('locales/')) parseJson(path, files[path], problems)
  }

  if (problems.length > 0 || !manifest) throw new ThemePackageException(problems)

  return {
    manifest,
    settingsSchema,
    settingsData,
    sectionSchemas,
    templates,
    files,
    hash: createHash('sha256').update(zip).digest('hex'),
  }
}

/** Zips a theme folder (bundled themes) the same way an author would. */
export async function packThemeFolder(root: string): Promise<Uint8Array> {
  const files: ThemeFiles = {}
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (entry.isFile()) {
        files[relative(root, path).split(sep).join('/')] = new Uint8Array(await readFile(path))
      }
    }
  }
  await walk(root)
  return zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') })
}

/** Rewrites the package with the given settings and templates (theme download). */
export function repackTheme(
  pkg: ThemePackage,
  settingsData: ThemeSettingsData,
  templates: Record<string, ThemeTemplateData>,
  fileOverrides: Record<string, string> = {}
): Uint8Array {
  const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value, null, 2))
  const files: ThemeFiles = { ...pkg.files }
  for (const [path, content] of Object.entries(fileOverrides)) {
    files[path] = new TextEncoder().encode(content)
  }
  files['config/settings_data.json'] = encode({
    current: settingsData.current,
    sections: Object.fromEntries(
      Object.entries(settingsData.sections).map(([id, section]) => [id, toFileSection(section)])
    ),
  })
  for (const path of Object.keys(files)) {
    if (path.startsWith('templates/')) delete files[path]
  }
  for (const [name, template] of Object.entries(templates)) {
    files[`templates/${name}.json`] = encode({
      sections: Object.fromEntries(
        Object.entries(template.sections).map(([id, section]) => [id, toFileSection(section)])
      ),
      order: template.order,
    })
  }
  return zipSync(files)
}

function toFileSection(section: ThemeTemplateData['sections'][string]) {
  return {
    type: section.type,
    settings: section.settings,
    blocks: section.blocks,
    block_order: section.blockOrder,
    ...(section.disabled ? { disabled: true } : {}),
  }
}

/**
 * Writes the package to `dir`. Files land in a sibling temp folder that is
 * renamed into place, so a concurrent request never sees half a theme.
 */
export async function extractThemePackage(files: ThemeFiles, dir: string): Promise<void> {
  const staging = `${dir}.tmp-${process.pid}-${Date.now()}`
  await rm(staging, { recursive: true, force: true })
  for (const [path, bytes] of Object.entries(files)) {
    const target = join(staging, ...path.split('/'))
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes)
  }
  try {
    await rename(staging, dir)
  } catch (error) {
    await rm(staging, { recursive: true, force: true })
    if (
      (error as NodeJS.ErrnoException).code !== 'ENOTEMPTY' &&
      (error as NodeJS.ErrnoException).code !== 'EEXIST'
    ) {
      throw error
    }
  }
}
