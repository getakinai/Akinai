import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionCsvService from '#services/collection_csv_service'
import CsvImportResultTransformer from '#transformers/csv_import_result_transformer'
import { adminCsvImportStoreValidator } from '#validators/admin_csv_import_store_validator'

@inject()
export default class AdminCollectionsImportStoreController {
  constructor(protected collectionCsvService: CollectionCsvService) {}

  async handle(ctx: HttpContext) {
    const { file } = await ctx.request.validateUsing(adminCsvImportStoreValidator)
    const result = await this.collectionCsvService.import(file)

    return ctx.serialize(CsvImportResultTransformer.transform(result))
  }
}
