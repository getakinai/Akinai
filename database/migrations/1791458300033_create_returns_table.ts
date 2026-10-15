import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'returns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.integer('number').notNullable()
      table.string('status', 20).notNullable()
      table.string('customer_note', 1000).nullable()
      table.string('decline_reason', 500).nullable()
      table.string('staff_note', 1000).nullable()
      table.uuid('refund_id').nullable().references('id').inTable('refunds').onDelete('SET NULL')
      table.timestamp('requested_at').notNullable()
      table.timestamp('approved_at').nullable()
      table.timestamp('received_at').nullable()
      table.timestamp('closed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['order_id', 'number'])
      table.index(['status', 'created_at'])
      table.index(['customer_id', 'created_at'])
      table.index(['refund_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
