import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'discounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('title', 255).notNullable()
      table.string('code', 64).nullable().unique()
      table.string('method', 20).notNullable()
      table.string('value_type', 20).notNullable()
      table.decimal('value', 12, 2).notNullable()
      table.decimal('min_subtotal', 12, 2).nullable()
      table.integer('usage_limit').nullable()
      table.integer('usage_count').notNullable().defaultTo(0)
      table.boolean('once_per_customer').notNullable().defaultTo(false)
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').nullable()
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['method', 'archived_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
