import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import StoreSettingService from '#services/store_setting_service'

/**
 * Creates the store settings row with defaults when none exists. Safe to
 * re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const storeSettingService = await app.container.make(StoreSettingService)
    await storeSettingService.get()
  }
}
