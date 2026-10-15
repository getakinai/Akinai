import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminProductsListQueryValidator } from '#validators/admin_products_list_query_validator'

@inject()
export default class AdminProductsListController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminProductsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const products = await this.productService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(ProductTransformer.paginate(products.all(), products.getMeta()))
  }
}
