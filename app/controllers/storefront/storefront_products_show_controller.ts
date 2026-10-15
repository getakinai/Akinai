import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'
import ThemeRenderer from '#theme_host/renderer'
import { storefrontProductShowQueryValidator } from '#validators/storefront_product_show_query_validator'
import { storefrontProductSlugValidator } from '#validators/storefront_product_slug_validator'

@inject()
export default class StorefrontProductsShowController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontMarketService: StorefrontMarketService,
    protected storefrontPrefetchService: StorefrontPrefetchService,
    protected themeRenderer: ThemeRenderer
  ) {}

  async handle(ctx: HttpContext) {
    const { inertia, params, request } = ctx
    const [error, payload] = await storefrontProductSlugValidator.tryValidate({
      slug: params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const [queryError, query] = await storefrontProductShowQueryValidator.tryValidate(request.qs())

    const market = await this.storefrontMarketService.current(ctx)
    const seo = await this.storefrontSeoService.forProduct(payload.slug, market)
    const themed = await this.themeRenderer.render(ctx, {
      template: 'product',
      seo,
      data: async () => {
        const prefetch = await this.storefrontPrefetchService.product(ctx, payload.slug, {
          always: true,
        })
        if (!prefetch?.product) throw new lucidErrors.E_ROW_NOT_FOUND()
        return prefetch
      },
    })
    if (themed !== null) return themed

    const prefetch = await this.storefrontPrefetchService.product(ctx, payload.slug)
    return inertia.render(
      'products/show',
      {
        slug: payload.slug,
        collection: queryError ? null : (query.collection ?? null),
        prefetch: prefetch && (await ctx.serialize.withoutWrapping(prefetch)),
      },
      { seo }
    )
  }
}
