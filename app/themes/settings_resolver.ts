import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { ThemeSettingDefinition } from '#constants/themes'
import PageService from '#services/page_service'
import StorefrontCollectionService from '#services/storefront_collection_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontProductService from '#services/storefront_product_service'
import StorefrontCollectionTransformer from '#transformers/storefront_collection_transformer'
import StorefrontMenuItemTransformer from '#transformers/storefront_menu_item_transformer'
import StorefrontPageTransformer from '#transformers/storefront_page_transformer'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import StorefrontProductTransformer from '#transformers/storefront_product_transformer'
import { imageUrl } from '#utils/image_url'
import { orNullIfMissing } from '#utils/or_null_if_missing'
import { sanitizeRichText } from '#utils/sanitize_rich_text'

const COLLECTION_LIST = { page: 1, sort: 'featured', direction: 'asc' } as const

function typeDefault(setting: ThemeSettingDefinition) {
  if (setting.type === 'checkbox') return false
  if (setting.type === 'text' || setting.type === 'textarea') return ''
  return null
}

/**
 * Turns saved setting values into what templates use: image keys into URLs,
 * product, collection and page handles into storefront data, and rich text
 * into sanitized HTML. Lookups are memoized for the request, so ten
 * sections pointing at one collection load it once.
 */
@inject()
export default class ThemeSettingsResolver {
  protected cache = new Map<string, Promise<unknown>>()

  constructor(
    protected storefrontProductService: StorefrontProductService,
    protected storefrontCollectionService: StorefrontCollectionService,
    protected storefrontMarketService: StorefrontMarketService,
    protected storefrontMenuService: StorefrontMenuService,
    protected pageService: PageService
  ) {}

  async resolve(
    ctx: HttpContext,
    definitions: ThemeSettingDefinition[],
    values: Record<string, unknown>,
    assetUrl: (path: string) => string
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      definitions
        .filter((setting) => setting.id)
        .map(async (setting) => {
          const raw = setting.id! in values ? values[setting.id!] : setting.default
          const value = raw === undefined ? typeDefault(setting) : raw
          return [setting.id!, await this.value(ctx, setting, value, assetUrl)] as const
        })
    )
    return Object.fromEntries(entries)
  }

  protected async value(
    ctx: HttpContext,
    setting: ThemeSettingDefinition,
    value: unknown,
    assetUrl: (path: string) => string
  ): Promise<unknown> {
    if (setting.type === 'link_list') return this.memo('menu', () => this.menu(ctx))
    if (value === null || value === '') return setting.type === 'richtext' ? '' : value
    switch (setting.type) {
      case 'richtext':
        return typeof value === 'string' ? (sanitizeRichText(value) ?? '') : ''
      case 'image_picker':
        if (typeof value !== 'string') return null
        return {
          key: value,
          url: value.startsWith('assets/')
            ? assetUrl(value.slice('assets/'.length))
            : imageUrl(value),
        }
      case 'product':
        return typeof value === 'string'
          ? this.memo(`product:${value}`, () => this.product(ctx, value))
          : null
      case 'collection':
        return typeof value === 'string'
          ? this.memo(`collection:${value}`, () => this.collection(ctx, value))
          : null
      case 'page':
        return typeof value === 'string'
          ? this.memo(`page:${value}`, () => this.page(ctx, value))
          : null
      default:
        return value
    }
  }

  protected memo(key: string, load: () => Promise<unknown>) {
    let pending = this.cache.get(key)
    if (!pending) {
      pending = load()
      this.cache.set(key, pending)
    }
    return pending
  }

  protected async menu(ctx: HttpContext) {
    const items = await this.storefrontMenuService.listPublic()
    return ctx.serialize.withoutWrapping(
      StorefrontMenuItemTransformer.transform(items).useVariant('toPublic')
    )
  }

  protected async product(ctx: HttpContext, slug: string) {
    const market = await this.storefrontMarketService.current(ctx)
    const product = await orNullIfMissing(
      this.storefrontProductService.findBySlugOrFail(slug, market)
    )
    return product
      ? ctx.serialize.withoutWrapping(StorefrontProductTransformer.transform(product))
      : null
  }

  protected async collection(ctx: HttpContext, slug: string) {
    const market = await this.storefrontMarketService.current(ctx)
    const filters = this.storefrontCollectionService.toFilters({})
    const [collection, firstPage] = await Promise.all([
      orNullIfMissing(this.storefrontCollectionService.findBySlugOrFail(slug)),
      orNullIfMissing(
        this.storefrontCollectionService.paginateProducts(
          slug,
          { ...COLLECTION_LIST, filters },
          market
        )
      ),
    ])
    if (!collection) return null
    const data = (await ctx.serialize.withoutWrapping(
      StorefrontCollectionTransformer.transform(collection)
    )) as Record<string, unknown>
    const products = firstPage
      ? await ctx.serialize.withoutWrapping(
          StorefrontProductCardTransformer.transform(firstPage.products)
        )
      : []
    return { ...data, products }
  }

  protected async page(ctx: HttpContext, slug: string) {
    const page = await orNullIfMissing(this.pageService.findPublicBySlugOrFail(slug))
    return page ? ctx.serialize.withoutWrapping(StorefrontPageTransformer.transform(page)) : null
  }
}
