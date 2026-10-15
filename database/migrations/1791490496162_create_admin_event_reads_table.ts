import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_event_reads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('admin_event_id')
        .notNullable()
        .references('id')
        .inTable('admin_events')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'admin_event_id'])
      table.index(['admin_event_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
