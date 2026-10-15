import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'return_line_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('return_id').notNullable().references('id').inTable('returns').onDelete('CASCADE')
      table
        .uuid('order_line_item_id')
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('CASCADE')
      table.integer('quantity').notNullable()
      table.string('reason', 30).notNullable()
      table.string('note', 500).nullable()
      table.boolean('restock').notNullable().defaultTo(false)
      table
        .uuid('location_id')
        .nullable()
        .references('id')
        .inTable('locations')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['return_id'])
      table.index(['order_line_item_id'])
      table.index(['location_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
