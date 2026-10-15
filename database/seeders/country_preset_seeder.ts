import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CountryPresetService from '#services/country_preset_service'

/**
 * Creates the starting markets, tax rates and shipping zones for the
 * country of operation picked in first-run setup. Does nothing until a
 * country is set (setup applies the same defaults itself). Safe to re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const countryPresetService = await app.container.make(CountryPresetService)
    await countryPresetService.applyForStore()
  }
}
