import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionCsvService from '#services/collection_csv_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminCollectionsImportSampleController {
  constructor(protected collectionCsvService: CollectionCsvService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      this.collectionCsvService.sampleFilename,
      await this.collectionCsvService.sampleCsv()
    )
  }
}
