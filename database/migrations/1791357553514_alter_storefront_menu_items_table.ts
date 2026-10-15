import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_menu_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['collection_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['collection_id'])
    })
  }
}
