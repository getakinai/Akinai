import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductImportProgressService from '#services/product_import_progress_service'
import ProductImportService from '#services/product_import_service'
import CsvImportResultTransformer from '#transformers/csv_import_result_transformer'
import { csvExportActor } from '#utils/csv'
import { adminProductsImportStoreValidator } from '#validators/admin_products_import_store_validator'

@inject()
export default class AdminProductsImportStoreController {
  constructor(
    protected productImportService: ProductImportService,
    protected productImportProgressService: ProductImportProgressService
  ) {}

  async handle(ctx: HttpContext) {
    const { file, importId } = await ctx.request.validateUsing(adminProductsImportStoreValidator)
    const actor = csvExportActor(ctx)
    const progress = this.productImportProgressService.reporter(actor.user.id, importId)
    const result = await this.productImportService.import(file, actor, progress)

    return ctx.serialize(CsvImportResultTransformer.transform(result))
  }
}
