import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorCsvService from '#services/vendor_csv_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminVendorsImportSampleController {
  constructor(protected vendorCsvService: VendorCsvService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      this.vendorCsvService.sampleFilename,
      await this.vendorCsvService.sampleCsv()
    )
  }
}
