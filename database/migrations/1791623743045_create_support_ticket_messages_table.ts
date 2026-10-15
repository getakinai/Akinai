import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'support_ticket_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('support_ticket_id')
        .notNullable()
        .references('id')
        .inTable('support_tickets')
        .onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.string('author_type', 20).notNullable()
      table.boolean('is_internal').notNullable().defaultTo(false)
      table.text('body').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['support_ticket_id', 'created_at'])
      table.index(['user_id'])
      table.index(['customer_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
