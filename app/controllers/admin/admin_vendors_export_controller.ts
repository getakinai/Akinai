import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorCsvService from '#services/vendor_csv_service'
import { csvExportActor, sendCsv } from '#utils/csv'
import { adminVendorsExportQueryValidator } from '#validators/admin_vendors_export_query_validator'

@inject()
export default class AdminVendorsExportController {
  constructor(protected vendorCsvService: VendorCsvService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminVendorsExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv } = await this.vendorCsvService.exportCsv(filters, csvExportActor(ctx))
    return sendCsv(ctx.response, filename, csv)
  }
}
