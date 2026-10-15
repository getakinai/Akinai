import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionCsvService from '#services/option_csv_service'
import CsvImportResultTransformer from '#transformers/csv_import_result_transformer'
import { adminCsvImportStoreValidator } from '#validators/admin_csv_import_store_validator'

@inject()
export default class AdminOptionsImportStoreController {
  constructor(protected optionCsvService: OptionCsvService) {}

  async handle(ctx: HttpContext) {
    const { file } = await ctx.request.validateUsing(adminCsvImportStoreValidator)
    const result = await this.optionCsvService.import(file)

    return ctx.serialize(CsvImportResultTransformer.transform(result))
  }
}
