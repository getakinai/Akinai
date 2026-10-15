import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'option_definition_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('option_definition_id')
        .notNullable()
        .references('id')
        .inTable('option_definitions')
        .onDelete('CASCADE')
      table.string('value', 64).notNullable()
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['option_definition_id', 'value'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
