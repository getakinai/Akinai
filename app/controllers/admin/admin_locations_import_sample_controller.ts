import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationCsvService from '#services/location_csv_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminLocationsImportSampleController {
  constructor(protected locationCsvService: LocationCsvService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      this.locationCsvService.sampleFilename,
      await this.locationCsvService.sampleCsv()
    )
  }
}
