import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('product_label_id')
        .nullable()
        .references('id')
        .inTable('product_labels')
        .onDelete('SET NULL')
      table.index(['product_label_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['product_label_id'])
      table.dropForeign(['product_label_id'])
      table.dropColumn('product_label_id')
    })
  }
}
