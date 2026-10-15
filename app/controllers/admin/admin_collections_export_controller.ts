import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionCsvService from '#services/collection_csv_service'
import { csvExportActor, sendCsv } from '#utils/csv'
import { adminCollectionsExportQueryValidator } from '#validators/admin_collections_export_query_validator'

@inject()
export default class AdminCollectionsExportController {
  constructor(protected collectionCsvService: CollectionCsvService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminCollectionsExportQueryValidator, {
      data: ctx.request.qs(),
    })
    const { filename, csv } = await this.collectionCsvService.exportCsv(
      filters,
      csvExportActor(ctx)
    )
    return sendCsv(ctx.response, filename, csv)
  }
}
