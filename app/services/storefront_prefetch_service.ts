import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import PluginService from '#services/plugin_service'
import StoreSettingService from '#services/store_setting_service'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'
import StorefrontCollectionService from '#services/storefront_collection_service'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'
import StorefrontHomeContentService from '#services/storefront_home_content_service'
import StorefrontHomeService from '#services/storefront_home_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontProductService from '#services/storefront_product_service'
import StorefrontThemeService from '#services/storefront_theme_service'
import PluginTransformer from '#transformers/plugin_transformer'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import StorefrontCollectionTransformer from '#transformers/storefront_collection_transformer'
import StorefrontHeroSlideTransformer from '#transformers/storefront_hero_slide_transformer'
import StorefrontHomeContentTransformer from '#transformers/storefront_home_content_transformer'
import StorefrontHomeTransformer from '#transformers/storefront_home_transformer'
import StorefrontMarketTransformer from '#transformers/storefront_market_transformer'
import StorefrontMenuItemTransformer from '#transformers/storefront_menu_item_transformer'
import StorefrontPageTransformer from '#transformers/storefront_page_transformer'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import StorefrontProductTransformer from '#transformers/storefront_product_transformer'
import StorefrontThemeTransformer from '#transformers/storefront_theme_transformer'
import { orNullIfMissing } from '#utils/or_null_if_missing'

/** The order and filters the collection page opens with. */
const DEFAULT_COLLECTION_LIST = { sort: 'featured', direction: 'asc' } as const

/**
 * Data the server-rendered storefront pages (home, product, collection,
 * content page) need for their first paint, so crawlers get real headings
 * and links. Each entry is the same transformer output its JSON route
 * returns; the client seeds its query cache with it before rendering.
 *
 * Built only for full page loads. Inertia visits get `null` and the page
 * fetches through the JSON routes as usual.
 */
@inject()
export default class StorefrontPrefetchService {
  constructor(
    protected storeSettingService: StoreSettingService,
    protected storefrontThemeService: StorefrontThemeService,
    protected storefrontMenuService: StorefrontMenuService,
    protected pageService: PageService,
    protected storefrontMarketService: StorefrontMarketService,
    protected storefrontHomeService: StorefrontHomeService,
    protected storefrontHeroSlideService: StorefrontHeroSlideService,
    protected storefrontHomeContentService: StorefrontHomeContentService,
    protected storefrontProductService: StorefrontProductService,
    protected storefrontCollectionService: StorefrontCollectionService,
    protected catalogTokenService: StorefrontCatalogTokenService,
    protected pluginService: PluginService
  ) {}

  async home(ctx: HttpContext) {
    if (this.isInertiaVisit(ctx)) return null
    const { market, layout, installedKeys } = await this.layout(ctx)
    const [home, heroSlides, homeContent] = await Promise.all([
      this.storefrontHomeService.get(market),
      installedKeys.includes('hero_slideshow')
        ? this.storefrontHeroSlideService.listPublic()
        : null,
      this.storefrontHomeContentService.get(),
    ])
    return {
      ...layout,
      home: StorefrontHomeTransformer.transform(home),
      heroSlides: heroSlides
        ? StorefrontHeroSlideTransformer.transform(heroSlides).useVariant('toPublic')
        : null,
      homeContent: StorefrontHomeContentTransformer.transform(homeContent).depth(2),
    }
  }

  async product(ctx: HttpContext, slug: string) {
    if (this.isInertiaVisit(ctx)) return null
    const { market, layout } = await this.layout(ctx)
    const product = await orNullIfMissing(
      this.storefrontProductService.findBySlugOrFail(slug, market)
    )
    return {
      ...layout,
      product: product ? StorefrontProductTransformer.transform(product) : null,
    }
  }

  async collection(ctx: HttpContext, slug: string) {
    if (this.isInertiaVisit(ctx)) return null
    const { market, layout } = await this.layout(ctx)
    const filters = this.storefrontCollectionService.toFilters({})
    const [collection, firstPage] = await Promise.all([
      orNullIfMissing(this.storefrontCollectionService.findBySlugOrFail(slug)),
      orNullIfMissing(
        this.storefrontCollectionService.paginateProducts(
          slug,
          { page: 1, ...DEFAULT_COLLECTION_LIST, filters },
          market
        )
      ),
    ])
    const scope = this.catalogTokenService.scope({
      list: 'collection-products',
      slug,
      ...DEFAULT_COLLECTION_LIST,
      filters,
    })
    return {
      ...layout,
      collection: collection ? StorefrontCollectionTransformer.transform(collection) : null,
      collectionProducts: firstPage
        ? StorefrontProductCardTransformer.paginate(firstPage.products, {
            total: firstPage.meta.total,
            nextCursor: this.catalogTokenService.nextCursor(
              ctx.session,
              scope,
              1,
              firstPage.meta.lastPage
            ),
          })
        : null,
    }
  }

  async page(ctx: HttpContext, slug: string) {
    if (this.isInertiaVisit(ctx)) return null
    const [{ layout }, page] = await Promise.all([
      this.layout(ctx),
      orNullIfMissing(this.pageService.findPublicBySlugOrFail(slug)),
    ])
    return { ...layout, page: page ? StorefrontPageTransformer.transform(page) : null }
  }

  protected isInertiaVisit(ctx: HttpContext) {
    return Boolean(ctx.request.header('x-inertia'))
  }

  /** What the storefront header and footer show on every page. */
  protected async layout(ctx: HttpContext) {
    const [settings, theme, menu, policies, marketState, catalog] = await Promise.all([
      this.storeSettingService.get(),
      this.storefrontThemeService.get(),
      this.storefrontMenuService.listPublic(),
      this.pageService.policies(),
      this.storefrontMarketService.state(ctx),
      this.pluginService.catalog(),
    ])
    const installed = catalog.filter((plugin) => plugin.isInstalled)
    return {
      market: marketState.current,
      installedKeys: installed.map((plugin) => plugin.key),
      layout: {
        plugins: PluginTransformer.transform(installed).useVariant('toPublic'),
        settings: StoreSettingTransformer.transform(settings).useVariant('toPublic'),
        theme: StorefrontThemeTransformer.transform(theme).useVariant('toPublic'),
        menu: StorefrontMenuItemTransformer.transform(menu).useVariant('toPublic'),
        policies: StorefrontPageTransformer.transform(policies).useVariant('toPolicy'),
        market: StorefrontMarketTransformer.transform(marketState),
      },
    }
  }
}
