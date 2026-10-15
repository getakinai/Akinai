import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'

@inject()
export default class StorefrontHomeController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontPrefetchService: StorefrontPrefetchService
  ) {}

  async handle(ctx: HttpContext) {
    const [seo, prefetch] = await Promise.all([
      this.storefrontSeoService.forHome(),
      this.storefrontPrefetchService.home(ctx),
    ])
    return ctx.inertia.render(
      'home',
      { prefetch: prefetch && (await ctx.serialize.withoutWrapping(prefetch)) },
      { seo }
    )
  }
}
