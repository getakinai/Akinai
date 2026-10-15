import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_payment_proofs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('order_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table.string('image_key', 255).nullable()
      table.text('details').nullable()
      table.timestamp('submitted_at').notNullable()
      table.timestamp('reviewed_at').nullable()
      table
        .uuid('reviewed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('rejection_reason', 500).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['reviewed_by_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
