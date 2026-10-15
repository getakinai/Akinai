import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'
import ThemeRenderer from '#theme_host/renderer'
import { storefrontPageSlugValidator } from '#validators/storefront_page_slug_validator'

@inject()
export default class StorefrontPagesShowController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontPrefetchService: StorefrontPrefetchService,
    protected themeRenderer: ThemeRenderer
  ) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontPageSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const seo = await this.storefrontSeoService.forPage(payload.slug)
    const themed = await this.themeRenderer.render(ctx, {
      template: 'page',
      seo,
      data: async () => {
        const prefetch = await this.storefrontPrefetchService.page(ctx, payload.slug, {
          always: true,
        })
        if (!prefetch?.page) throw new lucidErrors.E_ROW_NOT_FOUND()
        return prefetch
      },
    })
    if (themed !== null) return themed

    const prefetch = await this.storefrontPrefetchService.page(ctx, payload.slug)
    return ctx.inertia.render(
      'pages/show',
      {
        slug: payload.slug,
        prefetch: prefetch && (await ctx.serialize.withoutWrapping(prefetch)),
      },
      { seo }
    )
  }
}
