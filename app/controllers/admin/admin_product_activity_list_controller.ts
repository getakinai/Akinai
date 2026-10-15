import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import ProductService from '#services/product_service'
import RecordActivityTransformer from '#transformers/record_activity_transformer'
import { adminProductActivityListQueryValidator } from '#validators/admin_product_activity_list_query_validator'

@inject()
export default class AdminProductActivityListController {
  constructor(
    protected productService: ProductService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminProductActivityListQueryValidator, {
      data: ctx.request.qs(),
    })
    const product = await this.productService.findOrFail(ctx.params.id)
    const variantIds = await this.productService.variantIdsFor(product.id)
    const logs = await this.auditLogService.paginateForProduct(product.id, variantIds, filters)

    return ctx.serialize(RecordActivityTransformer.paginate(logs.all(), logs.getMeta()))
  }
}
