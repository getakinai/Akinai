import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ProductTypeService from '#services/product_type_service'
import VendorService from '#services/vendor_service'

const PRODUCT_TYPES = ['Smartphone', 'Laptop', 'Tablet', 'Audio', 'Accessory']

const VENDORS = ['Apple', 'Beats', 'Akinai Gadgets']

/**
 * Sample product types and vendors for the product form dropdowns. Part of
 * the demo store (`node ace seed:demo-store`). Safe to re-run: names that
 * already exist (any case) are skipped, and archived ones stay archived.
 */
export default class CatalogDefaultSeeder extends BaseSeeder {
  async run() {
    const productTypeService = await app.container.make(ProductTypeService)
    const vendorService = await app.container.make(VendorService)

    for (const name of PRODUCT_TYPES) await productTypeService.ensure(name)
    for (const name of VENDORS) await vendorService.ensure(name)
  }
}
