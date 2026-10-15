import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_prices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('product_variant_id')
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table.uuid('market_id').notNullable().references('id').inTable('markets').onDelete('CASCADE')
      table.decimal('price', 12, 2).notNullable()
      table.decimal('compare_at_price', 12, 2).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['product_variant_id', 'market_id'])
      table.index(['market_id', 'price'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
