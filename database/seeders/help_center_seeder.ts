import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { HELP_CENTER_CONTENT } from '#database/data/help_center_content'
import HelpCenterService from '#services/help_center_service'

/**
 * Copies the starter help guides (`database/data/help_center_content.ts`)
 * into the database. Safe to re-run: only new category and article slugs
 * are inserted, so guides staff edited in the back office are kept.
 */
export default class extends BaseSeeder {
  async run() {
    const helpCenterService = await app.container.make(HelpCenterService)
    const result = await helpCenterService.importStarterContent(HELP_CENTER_CONTENT)
    logger.info(result, 'help center starter guides imported')
  }
}
