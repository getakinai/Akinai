import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import { urlFor } from '@adonisjs/core/services/url_builder'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { Edge } from 'edge.js'
import type {
  ThemeSectionData,
  ThemeSettingsData,
  ThemeTemplateData,
  ThemeTemplateType,
} from '#constants/themes'
import type Theme from '#models/theme'
import ThemeRepository from '#repositories/theme_repository'
import type { SeoMeta } from '#services/storefront_seo_service'
import ThemeSettingsResolver from '#theme_host/settings_resolver'
import { ensureThemeExtracted } from '#theme_host/storage'
import { imageUrl } from '#utils/image_url'
import { formatMoney } from '#utils/money'

/** Session key of the theme a staff member (or share link) is previewing. */
export const THEME_PREVIEW_SESSION_KEY = 'theme_preview'

/** `builtin` previews the React storefront while an uploaded theme is live. */
export type ThemePreviewState = { themeId: string | 'builtin'; staff: boolean }

/** React islands a theme may place with `island(name, props)`. */
export const THEME_ISLANDS = ['cart_button', 'add_to_cart'] as const

/** Prefetch keys that belong to the built-in theme; uploaded themes get `store` and their own `settings`. */
const BUILTIN_ONLY_KEYS = ['settings', 'theme', 'homeContent'] as const

export type ThemePageInput = {
  template: ThemeTemplateType
  seo: SeoMeta | null
  /** Unserialized prefetch payload (`StorefrontPrefetchService`). */
  data: () => Promise<object | null>
}

type Json = Record<string, any>

const engines = new Map<string, Edge>()
const locales = new Map<string, Json>()

/** One Edge instance per package, rooted at its extracted folder and nothing else. */
function engineFor(hash: string, dir: string): Edge {
  let engine = engines.get(hash)
  if (!engine) {
    engine = Edge.create({ cache: app.inProduction })
    engine.mount(dir)
    engines.set(hash, engine)
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
  ): Promise<{ theme: Theme; preview: ThemePreviewState | null } | null> {
    const preview = ctx.session.get(THEME_PREVIEW_SESSION_KEY) as ThemePreviewState | undefined
    if (preview) {
      if (preview.themeId === 'builtin') return null
      const theme = await this.themeRepository.find(preview.themeId)
      if (theme) return { theme, preview }
      ctx.session.forget(THEME_PREVIEW_SESSION_KEY)
    }
    const live = await this.themeRepository.live()
    return live ? { theme: live, preview: null } : null
  }

  async render(ctx: HttpContext, input: ThemePageInput): Promise<string | null> {
    const active = await this.active(ctx)
    if (!active) return null
    const { theme, preview } = active

    const view = ctx.request.qs().view
    const suffix = typeof view === 'string' && /^[a-z0-9_-]{1,40}$/.test(view) ? view : null
    const template =
      (suffix && (await this.themeRepository.template(theme, `${input.template}.${suffix}`))) ||
      (await this.themeRepository.template(theme, input.template))
    if (!template) return null

    // Inertia links from checkout or account pages expect JSON; send them to a full page load.
    if (ctx.request.header('x-inertia')) {
      ctx.inertia.location(ctx.request.url(true))
      return ''
    }

    try {
      return await this.renderTemplate(ctx, theme, template.name, template.data, input, preview)
    } catch (error) {
      if (error instanceof lucidErrors.E_ROW_NOT_FOUND) throw error
      ctx.logger.error({ err: error, theme: theme.id }, 'Theme failed to render')
      if (preview) throw error
      return null
    }
  }

  protected async renderTemplate(
    ctx: HttpContext,
    theme: Theme,
    templateName: string,
    templateData: ThemeTemplateData,
    input: ThemePageInput,
    preview: ThemePreviewState | null
  ): Promise<string> {
    const raw = await input.data()
    const data = (raw ? await ctx.serialize.withoutWrapping(raw) : {}) as Json
    const dir = await ensureThemeExtracted(theme)
    const edge = engineFor(theme.packageHash, dir)
    const [settingsRow, locale, resolver] = await Promise.all([
      this.themeRepository.settings(theme),
      localeFor(theme.packageHash, dir),
      ctx.containerResolver.make(ThemeSettingsResolver),
    ])
    const settingsData: ThemeSettingsData = settingsRow?.data ?? { current: {}, sections: {} }

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
      island: (name: string, props?: Record<string, unknown>, fallback?: string) =>
        (THEME_ISLANDS as readonly string[]).includes(name)
          ? islandMarkup(name, props, fallback)
          : '',
    }

    const resources: Json = { ...data }
    for (const key of BUILTIN_ONLY_KEYS) delete resources[key]
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
      designMode: false,
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
            return {
              id: blockId,
              type: block.type,
              settings: blockSchema
                ? await resolver.resolve(ctx, blockSchema.settings, block.settings, assetUrl)
                : {},
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

    const akinaiHead = await ctx.view.render('themes/head', {
      seo: input.seo,
      robots: preview ? 'noindex, nofollow' : null,
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
    if (preview) {
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
