import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'help_category_groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('help_category_id')
        .notNullable()
        .references('id')
        .inTable('help_categories')
        .onDelete('CASCADE')
      table.string('slug', 100).notNullable()
      table.string('title', 120).notNullable()
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['help_category_id', 'slug'])
      table.index(['help_category_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
