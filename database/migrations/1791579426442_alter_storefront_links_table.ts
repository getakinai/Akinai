import { BaseSchema } from '@adonisjs/lucid/schema'

const LINK_TABLES = [
  'storefront_menu_items',
  'storefront_hero_slides',
  'storefront_promo_banners',
] as const

export default class extends BaseSchema {
  async up() {
    for (const tableName of LINK_TABLES) {
      this.schema.alterTable(tableName, (table) => {
        table.uuid('page_id').nullable().references('id').inTable('pages').onDelete('SET NULL')
        table.index(['page_id'])
      })
    }
  }

  async down() {
    for (const tableName of LINK_TABLES) {
      this.schema.alterTable(tableName, (table) => {
        table.dropIndex(['page_id'])
        table.dropForeign(['page_id'])
        table.dropColumn('page_id')
      })
    }
  }
}
