import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_rate_prices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('shipping_rate_id')
        .notNullable()
        .references('id')
        .inTable('shipping_rates')
        .onDelete('CASCADE')
      table.uuid('market_id').notNullable().references('id').inTable('markets').onDelete('CASCADE')
      table.decimal('price', 12, 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['shipping_rate_id', 'market_id'])
      table.index(['market_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
