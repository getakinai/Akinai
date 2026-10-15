import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_rates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('min_weight', 10, 3).nullable()
      table.decimal('max_weight', 10, 3).nullable()
      table.integer('min_items').nullable()
      table.integer('max_items').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('min_weight')
      table.dropColumn('max_weight')
      table.dropColumn('min_items')
      table.dropColumn('max_items')
    })
  }
}
