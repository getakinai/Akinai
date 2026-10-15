import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontThemeService from '#services/storefront_theme_service'

const STARTER_COLLECTIONS = 5

/**
 * Creates the default storefront theme, and a starter menu (Home plus the
 * first few active collections) when the menu is empty. Safe to re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const themeService = await app.container.make(StorefrontThemeService)
    const menuService = await app.container.make(StorefrontMenuService)
    const catalogRepository = await app.container.make(StorefrontCatalogRepository)

    await themeService.get()

    const existing = await menuService.list()
    if (existing.length > 0) return

    await menuService.create({ label: 'Home', type: 'url', url: '/' })
    const collections = await catalogRepository.activeCollections()
    for (const collection of collections.slice(0, STARTER_COLLECTIONS)) {
      await menuService.create({
        label: collection.title,
        type: 'collection',
        collectionId: collection.id,
      })
    }
  }
}
