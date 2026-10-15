import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontCollectionService from '#services/storefront_collection_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontCollectionFiltersTransformer from '#transformers/storefront_collection_filters_transformer'
import { storefrontCollectionSlugValidator } from '#validators/storefront_collection_slug_validator'

@inject()
export default class StorefrontCollectionFiltersListController {
  constructor(
    protected storefrontCollectionService: StorefrontCollectionService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontCollectionSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const market = await this.storefrontMarketService.current(ctx)
    const facets = await this.storefrontCollectionService.facets(params.slug, market)
    return ctx.serialize(StorefrontCollectionFiltersTransformer.transform(facets))
  }
}
