import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionCsvService from '#services/option_csv_service'
import { sendCsv } from '#utils/csv'

@inject()
export default class AdminOptionsImportSampleController {
  constructor(protected optionCsvService: OptionCsvService) {}

  async handle({ response }: HttpContext) {
    return sendCsv(
      response,
      this.optionCsvService.sampleFilename,
      await this.optionCsvService.sampleCsv()
    )
  }
}
