import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductLabelService from '#services/product_label_service'
import ProductLabelTransformer from '#transformers/product_label_transformer'
import { adminProductLabelsListQueryValidator } from '#validators/admin_product_labels_list_query_validator'

@inject()
export default class AdminProductLabelsListController {
  constructor(protected productLabelService: ProductLabelService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminProductLabelsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const labels = await this.productLabelService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(ProductLabelTransformer.paginate(labels.all(), labels.getMeta()))
  }
}
