import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_option_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('product_variant_id')
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table
        .uuid('product_option_value_id')
        .notNullable()
        .references('id')
        .inTable('product_option_values')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['product_variant_id', 'product_option_value_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
