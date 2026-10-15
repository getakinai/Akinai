import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('product_options', (table) => {
      table
        .uuid('option_definition_id')
        .nullable()
        .references('id')
        .inTable('option_definitions')
        .onDelete('RESTRICT')
    })

    this.schema.alterTable('product_option_values', (table) => {
      table
        .uuid('option_definition_value_id')
        .nullable()
        .references('id')
        .inTable('option_definition_values')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('product_option_values', (table) => {
      table.dropColumn('option_definition_value_id')
    })
    this.schema.alterTable('product_options', (table) => {
      table.dropColumn('option_definition_id')
    })
  }
}
