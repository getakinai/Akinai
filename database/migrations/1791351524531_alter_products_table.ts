import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Replaces the free-text product type and vendor with references to the
 * product_types and vendors tables. Existing text values are not carried
 * over.
 */
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['product_type'])
      table.dropIndex(['vendor'])
      table.dropColumn('product_type')
      table.dropColumn('vendor')

      table
        .uuid('product_type_id')
        .nullable()
        .references('id')
        .inTable('product_types')
        .onDelete('SET NULL')
        .index()
      table
        .uuid('vendor_id')
        .nullable()
        .references('id')
        .inTable('vendors')
        .onDelete('SET NULL')
        .index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['product_type_id'])
      table.dropForeign(['vendor_id'])
      table.dropIndex(['product_type_id'])
      table.dropIndex(['vendor_id'])
      table.dropColumn('product_type_id')
      table.dropColumn('vendor_id')

      table.string('product_type', 255).nullable().index()
      table.string('vendor', 255).nullable().index()
    })
  }
}
