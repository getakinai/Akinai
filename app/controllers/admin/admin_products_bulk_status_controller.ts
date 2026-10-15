import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import BulkResultTransformer from '#transformers/bulk_result_transformer'
import { adminBulkStatusValidator } from '#validators/admin_bulk_status_validator'

@inject()
export default class AdminProductsBulkStatusController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const { ids, status } = await ctx.request.validateUsing(adminBulkStatusValidator)
    const result = await this.productService.bulkSetStatus(ids, status)
    return ctx.serialize(BulkResultTransformer.transform(result))
  }
}
