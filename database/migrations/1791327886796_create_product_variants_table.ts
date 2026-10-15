import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.string('sku', 64).nullable().unique()
      table.string('barcode', 64).nullable()
      table.decimal('price', 12, 2).notNullable().defaultTo(0)
      table.decimal('compare_at_price', 12, 2).nullable()
      table.boolean('track_inventory').notNullable().defaultTo(false)
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
