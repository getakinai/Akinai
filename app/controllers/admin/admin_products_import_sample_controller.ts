import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { PRODUCT_IMPORT_SAMPLE_FILENAME } from '#constants/product_import'
import ProductImportService from '#services/product_import_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminProductsImportSampleController {
  constructor(protected productImportService: ProductImportService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      PRODUCT_IMPORT_SAMPLE_FILENAME,
      await this.productImportService.sampleCsv()
    )
  }
}
