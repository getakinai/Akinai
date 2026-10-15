import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('type', 60).notNullable()
      table.string('subject', 255).notNullable()
      table.string('from_address', 254).nullable()
      table.json('to_addresses').notNullable()
      table.json('cc_addresses').nullable()
      table.json('bcc_addresses').nullable()
      table.text('html').nullable()
      table.text('text').nullable()
      table.boolean('redacted').notNullable().defaultTo(false)
      table.string('status', 20).notNullable()
      table.string('error', 500).nullable()
      table.string('provider_message_id', 255).nullable()
      table.timestamp('sent_at').nullable()
      table.uuid('order_id').nullable().references('id').inTable('orders').onDelete('SET NULL')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table
        .uuid('resent_from_id')
        .nullable()
        .references('id')
        .inTable('email_logs')
        .onDelete('SET NULL')
      table
        .uuid('resent_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['created_at'])
      table.index(['status', 'created_at'])
      table.index(['type', 'created_at'])
      table.index(['order_id', 'created_at'])
      table.index(['customer_id', 'created_at'])
      table.index(['resent_from_id'])
      table.index(['resent_by_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
