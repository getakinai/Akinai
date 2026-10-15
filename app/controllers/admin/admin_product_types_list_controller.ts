import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypeService from '#services/product_type_service'
import ProductTypeTransformer from '#transformers/product_type_transformer'
import { adminProductTypesListQueryValidator } from '#validators/admin_product_types_list_query_validator'

@inject()
export default class AdminProductTypesListController {
  constructor(protected productTypeService: ProductTypeService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminProductTypesListQueryValidator,
      { data: ctx.request.qs() }
    )
    const productTypes = await this.productTypeService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(
      ProductTypeTransformer.paginate(productTypes.all(), productTypes.getMeta())
    )
  }
}
