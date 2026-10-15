import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'
import ThemeRenderer from '#theme_host/renderer'
import { storefrontCollectionSlugValidator } from '#validators/storefront_collection_slug_validator'

@inject()
export default class StorefrontCollectionsShowController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontPrefetchService: StorefrontPrefetchService,
    protected themeRenderer: ThemeRenderer
  ) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontCollectionSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const seo = await this.storefrontSeoService.forCollection(payload.slug)
    const themed = await this.themeRenderer.render(ctx, {
      template: 'collection',
      seo,
      data: async () => {
        const prefetch = await this.storefrontPrefetchService.collection(ctx, payload.slug, {
          always: true,
        })
        if (!prefetch?.collection) throw new lucidErrors.E_ROW_NOT_FOUND()
        return prefetch
      },
    })
    if (themed !== null) return themed

    const prefetch = await this.storefrontPrefetchService.collection(ctx, payload.slug)
    return ctx.inertia.render(
      'collections/show',
      {
        slug: payload.slug,
        prefetch: prefetch && (await ctx.serialize.withoutWrapping(prefetch)),
      },
      { seo }
    )
  }
}
