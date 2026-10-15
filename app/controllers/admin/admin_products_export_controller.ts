import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/audit_log_service'
import ProductExportService from '#services/product_export_service'
import { sendCsv } from '#utils/csv'
import { adminProductsExportQueryValidator } from '#validators/admin_products_export_query_validator'

@inject()
export default class AdminProductsExportController {
  constructor(
    protected productExportService: ProductExportService,
    protected auditLogService: AuditLogService
  ) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminProductsExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv, productCount } = await this.productExportService.exportCsv(filters)

    await this.auditLogService.recordSecurityEvent(
      'products_exported',
      ctx.auth.use('web').getUserOrFail(),
      {
        ipAddress: ctx.request.ip(),
        details: { q: filters.q ?? null, status: filters.status ?? null, productCount },
      }
    )

    return sendCsv(ctx.response, filename, csv)
  }
}
