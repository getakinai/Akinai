import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SearchReindexProducts extends BaseCommand {
  static commandName = 'search:reindex-products'
  static description =
    'Create the product search collection when missing, then index every product from the database'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Drop and recreate the collection so schema changes apply' })
  declare fresh?: boolean

  async run() {
    /**
     * Imported lazily: ace loads command metadata before the app boots.
     */
    const { default: ProductSearchService } = await import('#services/product_search_service')

    const service = await this.app.container.make(ProductSearchService)
    const index = await service.ensureIndex(this.fresh ?? false)
    if (index === 'created') this.logger.info('Created the products search collection')

    const total = await service.reindexAll()
    this.logger.success(`Indexed ${total} products`)
  }
}
