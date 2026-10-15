import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('shipping_discount_id')
        .nullable()
        .references('id')
        .inTable('discounts')
        .onDelete('SET NULL')
      table.string('shipping_discount_code', 64).nullable()
      table.string('shipping_discount_title', 255).nullable()
      table.decimal('shipping_discount_total', 12, 2).notNullable().defaultTo(0)

      table.index(['discount_id'])
      table.index(['shipping_discount_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['discount_id'])
      table.dropIndex(['shipping_discount_id'])
      table.dropForeign(['shipping_discount_id'])
      table.dropColumn('shipping_discount_id')
      table.dropColumn('shipping_discount_code')
      table.dropColumn('shipping_discount_title')
      table.dropColumn('shipping_discount_total')
    })
  }
}
