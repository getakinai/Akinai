import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationCsvService from '#services/location_csv_service'
import { csvExportActor, sendCsv } from '#utils/csv'
import { adminLocationsExportQueryValidator } from '#validators/admin_locations_export_query_validator'

@inject()
export default class AdminLocationsExportController {
  constructor(protected locationCsvService: LocationCsvService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminLocationsExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv } = await this.locationCsvService.exportCsv(filters, csvExportActor(ctx))
    return sendCsv(ctx.response, filename, csv)
  }
}
