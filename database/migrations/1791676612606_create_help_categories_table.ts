import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'help_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('slug', 100).notNullable().unique()
      table.string('title', 120).notNullable()
      table.string('description', 300).notNullable()
      table.string('icon', 30).notNullable()
      table.boolean('popular').notNullable().defaultTo(false)
      table.integer('position').notNullable().defaultTo(0)
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['position'])
      table.index(['archived_at', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
