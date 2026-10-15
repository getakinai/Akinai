import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminCollectionProductsQueryValidator } from '#validators/admin_collection_products_query_validator'

@inject()
export default class AdminCollectionProductsListController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const { page, perPage } = await ctx.request.validateUsing(
      adminCollectionProductsQueryValidator,
      { data: ctx.request.qs() }
    )
    const products = await this.collectionService.paginateProducts(
      ctx.params.id,
      page ?? 1,
      perPage ?? 25
    )

    return ctx.serialize(ProductTransformer.paginate(products.all(), products.getMeta()))
  }
}
