import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import BulkResultTransformer from '#transformers/bulk_result_transformer'
import { adminBulkArchiveValidator } from '#validators/admin_bulk_archive_validator'

@inject()
export default class AdminProductsBulkArchiveController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const { ids, archived } = await ctx.request.validateUsing(adminBulkArchiveValidator)
    const result = await this.productService.bulkSetArchived(ids, archived)
    return ctx.serialize(BulkResultTransformer.transform(result))
  }
}
