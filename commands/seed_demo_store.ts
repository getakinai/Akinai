import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SeedDemoStore extends BaseCommand {
  static commandName = 'seed:demo-store'
  static description =
    'Fill the store with demo products, collections, options and menu links (run after db:seed)'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    /**
     * Imported lazily: ace loads command metadata before the app boots.
     */
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const { default: DemoStoreSeeder } = await import('../database/demo/demo_store_seeder.js')
    const { default: ProductSearchService } = await import('#services/product_search_service')

    const seeder = new DemoStoreSeeder(db.connection())
    await seeder.run()

    const { products, collections, menuItems } = seeder.summary
    this.logger.success(
      `Demo store ready: ${products} products, ${collections} collections and ${menuItems} menu links added`
    )

    try {
      const search = await this.app.container.make(ProductSearchService)
      const indexed = await search.reindexAll()
      this.logger.success(`Indexed ${indexed} products for search`)
    } catch (error) {
      this.logger.warning(
        `Search index not updated (${error instanceof Error ? error.message : error}). Run "node ace search:reindex-products" once Typesense is up.`
      )
    }
  }
}
