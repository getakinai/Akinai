import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypeCsvService from '#services/product_type_csv_service'
import { csvExportActor, sendCsv } from '#utils/csv'
import { adminProductTypesExportQueryValidator } from '#validators/admin_product_types_export_query_validator'

@inject()
export default class AdminProductTypesExportController {
  constructor(protected productTypeCsvService: ProductTypeCsvService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminProductTypesExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv } = await this.productTypeCsvService.exportCsv(
      filters,
      csvExportActor(ctx)
    )
    return sendCsv(ctx.response, filename, csv)
  }
}
