import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import LocationService from '#services/location_service'

/**
 * Creates the default stock location when none exists. Safe to re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const locationService = await app.container.make(LocationService)
    await locationService.ensureDefault('Main warehouse')
  }
}
