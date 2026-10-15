import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'discounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type', 30).notNullable().defaultTo('amount_off_order')
      table.string('applies_to', 20).nullable()
      table.string('buy_requirement', 20).nullable()
      table.decimal('buy_value', 12, 2).nullable()
      table.string('buy_applies_to', 20).nullable()
      table.integer('get_quantity').nullable()
      table.integer('max_uses_per_order').nullable()
      table.decimal('max_shipping_price', 12, 2).nullable()
      table.decimal('value', 12, 2).nullable().alter()

      table.index(['type', 'archived_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['type', 'archived_at'])
      table.dropColumn('type')
      table.dropColumn('applies_to')
      table.dropColumn('buy_requirement')
      table.dropColumn('buy_value')
      table.dropColumn('buy_applies_to')
      table.dropColumn('get_quantity')
      table.dropColumn('max_uses_per_order')
      table.dropColumn('max_shipping_price')
      table.decimal('value', 12, 2).notNullable().alter()
    })
  }
}
