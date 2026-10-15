import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_menu_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('label', 60).notNullable()
      table.string('type', 16).notNullable()
      table
        .uuid('collection_id')
        .nullable()
        .references('id')
        .inTable('collections')
        .onDelete('SET NULL')
      table.string('url', 500).nullable()
      table.integer('position').notNullable().defaultTo(0)
      table.boolean('is_visible').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
