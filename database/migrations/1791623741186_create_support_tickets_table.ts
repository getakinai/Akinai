import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'support_tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.integer('number').notNullable().unique()
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table
        .uuid('assigned_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('full_name', 120).notNullable()
      table.string('email', 254).notNullable()
      table.string('mobile', 20).notNullable()
      table.string('status', 20).notNullable()
      table.json('chat_transcript').notNullable()
      table.string('access_token_hash', 64).notNullable().unique()
      table.text('access_token_encrypted').notNullable()
      table.timestamp('access_token_expires_at').notNullable()
      table.timestamp('last_message_at').notNullable()
      table.timestamp('closed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['customer_id', 'last_message_at'])
      table.index(['assigned_user_id', 'status'])
      table.index(['status', 'last_message_at'])
      table.index(['last_message_at'])
      table.index(['email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
