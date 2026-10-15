import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_line_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('product_variant_id')
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table.string('product_title', 255).notNullable()
      table.string('variant_title', 255).nullable()
      table.string('sku', 255).nullable()
      table.decimal('unit_price', 12, 2).notNullable()
      table.integer('quantity').notNullable()
      table.decimal('line_total', 12, 2).notNullable()
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['order_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
