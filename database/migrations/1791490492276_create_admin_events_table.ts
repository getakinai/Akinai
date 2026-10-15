import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('type', 60).notNullable()
      table.string('channel', 60).notNullable()
      table.string('permission', 60).notNullable()
      table.string('title', 255).notNullable()
      table.json('details').notNullable()

      table.string('subject_type', 40).notNullable()
      table.uuid('subject_id').notNullable()
      table.string('subject_label', 255).nullable()
      table.uuid('order_id').nullable().references('id').inTable('orders').onDelete('SET NULL')

      table.string('actor_type', 20).notNullable()
      table.uuid('actor_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table
        .uuid('actor_customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.string('actor_label', 255).nullable()

      table.string('status', 20).notNullable()
      table.integer('attempts').notNullable().defaultTo(0)
      table.string('last_error', 500).nullable()
      table.timestamp('delivered_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['created_at'])
      table.index(['permission', 'created_at'])
      table.index(['status', 'created_at'])
      table.index(['type', 'created_at'])
      table.index(['subject_type', 'subject_id'])
      table.index(['order_id'])
      table.index(['actor_user_id'])
      table.index(['actor_customer_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
