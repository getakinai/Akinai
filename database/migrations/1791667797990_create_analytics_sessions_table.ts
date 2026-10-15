import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'analytics_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('visitor_id').notNullable()
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.uuid('market_id').nullable().references('id').inTable('markets').onDelete('SET NULL')
      table.timestamp('started_at').notNullable()
      table.timestamp('last_seen_at').notNullable()
      table.string('landing_path', 500).notNullable()
      table.string('referrer_host', 255).nullable()
      table.string('source', 20).notNullable()
      table.string('utm_source', 100).nullable()
      table.string('utm_medium', 100).nullable()
      table.string('utm_campaign', 100).nullable()
      table.string('device_type', 10).notNullable()
      table.integer('page_views').notNullable().defaultTo(0)
      table.boolean('viewed_product').notNullable().defaultTo(false)
      table.boolean('added_to_cart').notNullable().defaultTo(false)
      table.boolean('reached_checkout').notNullable().defaultTo(false)
      table
        .uuid('converted_order_id')
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['started_at'])
      table.index(['source', 'started_at'])
      table.index(['device_type', 'started_at'])
      table.index(['last_seen_at'])
      table.index(['visitor_id', 'started_at'])
      table.index(['customer_id'])
      table.index(['market_id'])
      table.index(['converted_order_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
