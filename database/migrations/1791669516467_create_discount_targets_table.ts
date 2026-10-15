import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'discount_targets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('discount_id')
        .notNullable()
        .references('id')
        .inTable('discounts')
        .onDelete('CASCADE')
      table.string('role', 10).notNullable()
      table.uuid('product_id').nullable().references('id').inTable('products').onDelete('CASCADE')
      table
        .uuid('collection_id')
        .nullable()
        .references('id')
        .inTable('collections')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['discount_id', 'role'])
      table.index(['product_id'])
      table.index(['collection_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
