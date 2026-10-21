import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import { urlFor } from '@adonisjs/core/services/url_builder'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { Edge } from 'edge.js'
import {
  THEME_APP_BLOCK_TYPE,
  type ThemeSectionData,
  type ThemeSettingsData,
  type ThemeTemplateData,
  type ThemeTemplateType,
} from '#constants/themes'
import type Theme from '#models/theme'
import ThemeRepository from '#repositories/theme_repository'
import type { SeoMeta } from '#services/storefront_seo_service'
import { hasPermission } from '#abilities/main'
import ThemeSettingsResolver from '#theme_host/settings_resolver'
import { buildThemeCustomCssHtml } from '#theme_host/theme_custom_css'
import { ensureThemeExtracted, ensureThemeExtractedForEditor } from '#theme_host/storage'
import {
  getThemeEngine,
  invalidateThemeEngine,
  registerThemeEngine,
} from '#theme_host/theme_engine_cache'
import { themeDirectoryProblems } from '#theme_host/template_policy'
import { imageUrl } from '#utils/image_url'
import { formatMoney } from '#utils/money'

/** Session key of the theme a staff member (or share link) is previewing. */
export const THEME_PREVIEW_SESSION_KEY = 'theme_preview'

/** While set, the storefront renders this theme's drafts for the signed-in editor. */
export const THEME_EDITOR_SESSION_KEY = 'theme_editor'

export type ThemeEditorState = { themeId: string }

const SECTION_ID = /^[A-Za-z0-9_-]{1,80}$/

/** `builtin` previews the React storefront while an uploaded theme is live. */
export type ThemePreviewState = { themeId: string | 'builtin'; staff: boolean }

/** React islands a theme may place with `island(name, props)`. */
export const THEME_ISLANDS = ['cart_button', 'add_to_cart', 'app_block'] as const

/** Prefetch keys that belong to the built-in theme; uploaded themes get `store` and their own `settings`. */
const BUILTIN_ONLY_KEYS = ['settings', 'theme', 'homeContent'] as const

export type ThemePageInput = {
  template: ThemeTemplateType
  seo: SeoMeta | null
  /** Unserialized prefetch payload (`StorefrontPrefetchService`). */
  data: () => Promise<object | null>
}

type Json = Record<string, any>

const locales = new Map<string, Json>()

export { invalidateThemeEngine }

/**
 * One Edge instance per package, rooted at its extracted folder and nothing else.
 * Templates are checked again here so a package extracted before the allowlist
 * existed is not compiled.
 */
async function engineFor(hash: string, dir: string): Promise<Edge> {
  let engine = getThemeEngine(hash) as Edge | undefined
  if (!engine) {
    const problems = await themeDirectoryProblems(dir)
    if (problems.length > 0) {
      throw new Error(`Theme template rejected: ${problems.slice(0, 5).join('; ')}`)
    }
    engine = Edge.create({ cache: app.inProduction })
    engine.mount(dir)
    registerThemeEngine(hash, engine)
  }
  return engine
}

async function localeFor(hash: string, dir: string): Promise<Json> {
  let locale = locales.get(hash)
  if (!locale) {
    try {
      locale = JSON.parse(await readFile(join(dir, 'locales', 'en.default.json'), 'utf8')) as Json
    } catch {
      locale = {}
    }
    locales.set(hash, locale)
  }
  return locale
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function scriptJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function islandMarkup(name: string, props: unknown, fallback: unknown) {
  const inner = typeof fallback === 'string' ? fallback : ''
  return `<div data-akinai-island="${escapeHtml(name)}" data-props="${escapeHtml(JSON.stringify(props ?? {}))}">${inner}</div>`
}

/**
 * Renders storefront pages with the live (or previewed) uploaded theme.
 * Returns null when the built-in React storefront should render instead:
 * no theme is live, the theme has no template for the page, or the theme
 * failed to render.
 */
@inject()
export default class ThemeRenderer {
  constructor(protected themeRepository: ThemeRepository) {}

  async active(
    ctx: HttpContext
  ): Promise<{ theme: Theme; preview: ThemePreviewState | null; editor: boolean } | null> {
    const editor = ctx.session.get(THEME_EDITOR_SESSION_KEY) as ThemeEditorState | undefined
    if (editor?.themeId) {
      const user = ctx.auth.use('web').user
      if (user && (await ctx.bouncer.allows(hasPermission, 'themes.edit'))) {
        const theme = await this.themeRepository.find(editor.themeId)
        if (theme) return { theme, preview: null, editor: true }
      }
      ctx.session.forget(THEME_EDITOR_SESSION_KEY)
    }

    const preview = ctx.session.get(THEME_PREVIEW_SESSION_KEY) as ThemePreviewState | undefined
    if (preview) {
      if (preview.themeId === 'builtin') return null
      const theme = await this.themeRepository.find(preview.themeId)
      if (theme) return { theme, preview, editor: false }
      ctx.session.forget(THEME_PREVIEW_SESSION_KEY)
    }
    const live = await this.themeRepository.live()
    return live ? { theme: live, preview: null, editor: false } : null
  }

  async render(ctx: HttpContext, input: ThemePageInput): Promise<string | null> {
    const active = await this.active(ctx)
    if (!active) return null
    const { theme, preview, editor } = active

    const view = ctx.request.qs().view
    const suffix = typeof view === 'string' && /^[a-z0-9_-]{1,40}$/.test(view) ? view : null
    const templateRow =
      (suffix && (await this.themeRepository.template(theme, `${input.template}.${suffix}`))) ||
      (await this.themeRepository.template(theme, input.template))
    if (!templateRow) return null

    const templateData = editor ? (templateRow.draftData ?? templateRow.data) : templateRow.data

    const sectionId = ctx.request.input('section_id')
    const sectionOnly =
      editor && typeof sectionId === 'string' && SECTION_ID.test(sectionId) ? sectionId : null

    // Inertia links from checkout or account pages expect JSON; send them to a full page load.
    if (ctx.request.header('x-inertia') && !sectionOnly) {
      ctx.inertia.location(ctx.request.url(true))
      return ''
    }

    try {
      const html = await this.renderTemplate(
        ctx,
        theme,
        templateRow.name,
        templateData,
        input,
        preview,
        editor,
        sectionOnly
      )
      if (sectionOnly) {
        ctx.response.header('content-type', 'text/html; charset=utf-8')
      }
      return html
    } catch (error) {
      if (error instanceof lucidErrors.E_ROW_NOT_FOUND) throw error
      ctx.logger.error({ err: error, theme: theme.id }, 'Theme failed to render')
      if (preview || editor) throw error
      return null
    }
  }

  protected async renderTemplate(
    ctx: HttpContext,
    theme: Theme,
    templateName: string,
    templateData: ThemeTemplateData,
    input: ThemePageInput,
    preview: ThemePreviewState | null,
    editor = false,
    sectionOnly: string | null = null
  ): Promise<string> {
    const raw = await input.data()
    const data = (raw ? await ctx.serialize.withoutWrapping(raw) : {}) as Json
    const editorDrafts = editor ? await this.themeRepository.sourceDraftMap(theme) : {}
    const dir = editor
      ? await ensureThemeExtractedForEditor(theme, editorDrafts)
      : await ensureThemeExtracted(theme)
    const engineKey = editor ? `${theme.packageHash}:${theme.id}` : theme.packageHash
    const edge = await engineFor(engineKey, dir)
    const [settingsRow, locale, resolver] = await Promise.all([
      this.themeRepository.settings(theme),
      localeFor(theme.packageHash, dir),
      ctx.containerResolver.make(ThemeSettingsResolver),
    ])
    const settingsData: ThemeSettingsData = editor
      ? (settingsRow?.draftData ?? settingsRow?.data ?? { current: {}, sections: {} })
      : (settingsRow?.data ?? { current: {}, sections: {} })

    const assetUrl = (path: string) =>
      `/themes/assets/${theme.packageHash}/assets/${String(path).replace(/^\/+/, '')}`
    const settings = await resolver.resolve(
      ctx,
      theme.settingsSchema.flatMap((group) => group.settings),
      settingsData.current,
      assetUrl
    )

    const store = data.settings ?? {}
    const moneyFormat = {
      locale: store.locale ?? 'en-NZ',
      currencyDisplay: store.currencyDisplay ?? 'symbol',
      currencyCode: data.market?.current?.currencyCode ?? store.currencyCode ?? 'NZD',
    }

    const helpers = {
      assetUrl,
      imageUrl: (value: unknown) => {
        if (value && typeof value === 'object' && 'url' in value) return String(value.url)
        return typeof value === 'string' && value ? imageUrl(value) : ''
      },
      money: (amount: unknown) =>
        typeof amount === 'number' ? formatMoney(amount, moneyFormat) : '',
      t: (key: string, vars: Record<string, unknown> = {}) => {
        const found = String(key)
          .split('.')
          .reduce<any>(
            (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
            locale
          )
        if (typeof found !== 'string') return key
        return found.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(vars[name] ?? ''))
      },
      route: (name: string, params?: Record<string, unknown>) => {
        try {
          return urlFor(name as any, params as any)
        } catch {
          return '#'
        }
      },
      pluginSlot: (name: string, fallback?: string) =>
        islandMarkup('plugin_slot', { name }, fallback),
      appBlock: (appBlockSettings: Record<string, unknown>) => {
        const plugin = typeof appBlockSettings.plugin === 'string' ? appBlockSettings.plugin : ''
        const block = typeof appBlockSettings.block === 'string' ? appBlockSettings.block : ''
        if (!plugin || !block) {
          return editor ? '<!-- App block: missing plugin or block -->' : ''
        }
        return islandMarkup('app_block', { plugin, block }, '')
      },
      island: (name: string, props?: Record<string, unknown>, fallback?: string) =>
        (THEME_ISLANDS as readonly string[]).includes(name)
          ? islandMarkup(name, props, fallback)
          : '',
    }

    const resources: Json = { ...data }
    for (const key of BUILTIN_ONLY_KEYS) delete resources[key]
    // A theme can only read names listed in app/themes/template_policy.ts.
    // Add a helper or root there before exposing it on this state object.
    const base: Json = {
      ...resources,
      ...helpers,
      store,
      settings,
      template: {
        name: templateName,
        type: input.template,
        suffix: templateName.split('.')[1] ?? null,
      },
      request: { path: ctx.request.url(), url: ctx.request.url(true) },
      currentYear: new Date().getFullYear(),
      designMode: editor,
    }

    const renderSection = async (id: string, section: ThemeSectionData) => {
      if (section.disabled) return ''
      const schema = theme.sectionSchemas[section.type]
      if (!schema) return ''
      const sectionSettings = await resolver.resolve(
        ctx,
        schema.settings,
        section.settings,
        assetUrl
      )
      const blocks = await Promise.all(
        section.blockOrder
          .filter((blockId) => section.blocks[blockId] && !section.blocks[blockId].disabled)
          .map(async (blockId) => {
            const block = section.blocks[blockId]
            const blockSchema = schema.blocks.find((entry) => entry.type === block.type)
            const resolvedSettings =
              block.type === THEME_APP_BLOCK_TYPE
                ? block.settings
                : blockSchema
                  ? await resolver.resolve(ctx, blockSchema.settings, block.settings, assetUrl)
                  : {}
            return {
              id: blockId,
              type: block.type,
              settings: resolvedSettings,
              attrs: `data-akinai-block-id="${escapeHtml(blockId)}"`,
            }
          })
      )
      let html: string
      try {
        html = await edge.render(`sections/${section.type}`, {
          ...base,
          section: { id, type: section.type, settings: sectionSettings, blocks },
        })
      } catch (error) {
        ctx.logger.error(
          { err: error, theme: theme.id, section: section.type },
          'Theme section failed'
        )
        html = preview ? `<!-- Section "${escapeHtml(section.type)}" failed to render -->` : ''
      }
      return `<div id="akinai-section-${escapeHtml(id)}" class="akinai-section akinai-section--${escapeHtml(section.type)}" data-akinai-section-id="${escapeHtml(id)}">${html}</div>`
    }

    if (sectionOnly) {
      const section =
        templateData.sections[sectionOnly] ?? settingsData.sections[sectionOnly] ?? null
      if (!section) return ''
      return renderSection(sectionOnly, section)
    }

    const sectionsHtml = await Promise.all(
      templateData.order
        .filter((id) => templateData.sections[id])
        .map((id) => renderSection(id, templateData.sections[id]))
    )
    const contentForLayout = sectionsHtml.join('\n')

    const staticSection = (type: string) => {
      const saved = settingsData.sections[type]
      if (saved) return renderSection(type, saved)
      if (!theme.sectionSchemas[type]) return Promise.resolve('')
      return renderSection(type, { type, settings: {}, blocks: {}, blockOrder: [] })
    }

    const nonce = ctx.response.nonce ?? ''
    const themeCustomCss = nonce
      ? buildThemeCustomCssHtml(theme.settingsSchema, settingsData.current, nonce)
      : ''

    const akinaiHead = await ctx.view.render('themes/head', {
      seo: input.seo,
      robots: preview || editor ? 'noindex, nofollow' : null,
      designMode: editor,
      themeCustomCss,
    })

    const page = await edge.render('layout/theme', {
      ...base,
      contentForLayout,
      akinaiHead,
      renderSection: staticSection,
    })

    const islandsData = {
      prefetch: {
        settings: data.settings,
        theme: data.theme,
        menu: data.menu,
        policies: data.policies,
        market: data.market,
        plugins: data.plugins,
      },
    }
    const tail = `<script type="application/json" id="akinai-islands-data">${scriptJson(islandsData)}</script>`
    const bodyEnd = page.lastIndexOf('</body>')
    let html = bodyEnd === -1 ? page + tail : page.slice(0, bodyEnd) + tail + page.slice(bodyEnd)
    if (preview && !editor) {
      const bar = await ctx.view.render('themes/preview_bar', {
        themeName: theme.name,
        isStaff: preview.staff,
      })
      const bodyStart = html.match(/<body\b[^>]*>/i)
      html =
        bodyStart?.index === undefined
          ? bar + html
          : html.slice(0, bodyStart.index + bodyStart[0].length) +
            bar +
            html.slice(bodyStart.index + bodyStart[0].length)
    }
    return html
  }
}
