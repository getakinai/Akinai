import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'analytics_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('session_id')
        .notNullable()
        .references('id')
        .inTable('analytics_sessions')
        .onDelete('CASCADE')
      table.string('type', 20).notNullable()
      table.string('path', 500).notNullable()
      table.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL')
      table.timestamp('occurred_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['session_id'])
      table.index(['type', 'occurred_at'])
      table.index(['product_id', 'occurred_at'])
      table.index(['occurred_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
