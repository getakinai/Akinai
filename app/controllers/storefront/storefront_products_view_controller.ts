import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontProductService from '#services/storefront_product_service'
import StorefrontProductTransformer from '#transformers/storefront_product_transformer'
import { storefrontProductSlugValidator } from '#validators/storefront_product_slug_validator'

@inject()
export default class StorefrontProductsViewController {
  constructor(
    protected storefrontProductService: StorefrontProductService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, payload] = await storefrontProductSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const market = await this.storefrontMarketService.current(ctx)
    const product = await this.storefrontProductService.findBySlugOrFail(payload.slug, market)
    return ctx.serialize(StorefrontProductTransformer.transform(product))
  }
}
