import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionCsvService from '#services/option_csv_service'
import { csvExportActor, sendCsv } from '#utils/csv'
import { adminOptionsExportQueryValidator } from '#validators/admin_options_export_query_validator'

@inject()
export default class AdminOptionsExportController {
  constructor(protected optionCsvService: OptionCsvService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminOptionsExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv } = await this.optionCsvService.exportCsv(filters, csvExportActor(ctx))
    return sendCsv(ctx.response, filename, csv)
  }
}
