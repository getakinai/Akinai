import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fulfillment_line_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('fulfillment_id')
        .notNullable()
        .references('id')
        .inTable('fulfillments')
        .onDelete('CASCADE')
      table
        .uuid('order_line_item_id')
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('CASCADE')
      table.integer('quantity').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['fulfillment_id'])
      table.index(['order_line_item_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
