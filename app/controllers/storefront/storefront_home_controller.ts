import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SetupService from '#services/setup_service'
import StorefrontPrefetchService from '#services/storefront_prefetch_service'
import StorefrontSeoService from '#services/storefront_seo_service'

@inject()
export default class StorefrontHomeController {
  constructor(
    protected storefrontSeoService: StorefrontSeoService,
    protected storefrontPrefetchService: StorefrontPrefetchService,
    protected setupService: SetupService
  ) {}

  async handle(ctx: HttpContext) {
    // Markets are created by first-run setup, so the storefront can't render before it.
    if (await this.setupService.isRequired()) {
      return ctx.response.redirect().toRoute('admin.setup.create')
    }

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
