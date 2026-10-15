import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypeCsvService from '#services/product_type_csv_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminProductTypesImportSampleController {
  constructor(protected productTypeCsvService: ProductTypeCsvService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      this.productTypeCsvService.sampleFilename,
      await this.productTypeCsvService.sampleCsv()
    )
  }
}
