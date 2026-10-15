import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_rate_prices'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('min_subtotal', 12, 2).nullable()
      table.decimal('max_subtotal', 12, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('min_subtotal')
      table.dropColumn('max_subtotal')
    })
  }
}
