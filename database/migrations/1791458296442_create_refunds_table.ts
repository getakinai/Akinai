import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'refunds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.decimal('amount', 12, 2).notNullable()
      table.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0)
      table.string('method', 20).notNullable()
      table.string('status', 20).notNullable()
      table.string('provider_refund_id', 255).nullable().unique()
      table.string('note', 500).nullable()
      table.string('failure_reason', 500).nullable()
      table
        .uuid('created_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['order_id', 'created_at'])
      table.index(['created_by_user_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
