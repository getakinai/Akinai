import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'
import { storefrontPageSlugValidator } from '#validators/storefront_page_slug_validator'

@inject()
export default class StorefrontPagesShowController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontPrefetchService: StorefrontPrefetchService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontPageSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const [seo, prefetch] = await Promise.all([
      this.storefrontSeoService.forPage(payload.slug),
      this.storefrontPrefetchService.page(ctx, payload.slug),
    ])
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
