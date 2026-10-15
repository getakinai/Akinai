import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'
import StorefrontCollectionService from '#services/storefront_collection_service'
import StorefrontMarketService from '#services/storefront_market_service'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import { storefrontCollectionProductsQueryValidator } from '#validators/storefront_collection_products_query_validator'
import { storefrontCollectionSlugValidator } from '#validators/storefront_collection_slug_validator'

@inject()
export default class StorefrontCollectionProductsListController {
  constructor(
    protected storefrontCollectionService: StorefrontCollectionService,
    protected storefrontMarketService: StorefrontMarketService,
    protected catalogTokenService: StorefrontCatalogTokenService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontCollectionSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const { cursor, ...query } = await ctx.request.validateUsing(
      storefrontCollectionProductsQueryValidator,
      { data: ctx.request.qs() }
    )
    const sort = query.sort ?? 'featured'
    const direction = query.direction ?? 'asc'
    const filters = this.storefrontCollectionService.toFilters(query)
    const scope = this.catalogTokenService.scope({
      list: 'collection-products',
      slug: params.slug,
      sort,
      direction,
      filters,
    })
    const page = this.catalogTokenService.pageFrom(ctx.session, scope, cursor)

    const market = await this.storefrontMarketService.current(ctx)
    const { products, meta } = await this.storefrontCollectionService.paginateProducts(
      params.slug,
      { page, sort, direction, filters },
      market
    )
    return ctx.serialize(
      StorefrontProductCardTransformer.paginate(products, {
        total: meta.total,
        nextCursor: this.catalogTokenService.nextCursor(ctx.session, scope, page, meta.lastPage),
      })
    )
  }
}
