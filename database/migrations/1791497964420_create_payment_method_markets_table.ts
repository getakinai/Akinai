import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_method_markets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('payment_method_id')
        .notNullable()
        .references('id')
        .inTable('payment_methods')
        .onDelete('CASCADE')
      table.uuid('market_id').notNullable().references('id').inTable('markets').onDelete('CASCADE')
      table.boolean('is_enabled').notNullable().defaultTo(false)
      table.json('config').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['payment_method_id', 'market_id'])
      table.index(['market_id', 'is_enabled'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
