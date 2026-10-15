import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_hero_slides'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('eyebrow', 60).nullable()
      table.string('heading', 120).notNullable()
      table.string('subheading', 240).nullable()
      table.string('button_label', 30).nullable()
      table.string('type', 16).notNullable()
      table
        .uuid('collection_id')
        .nullable()
        .references('id')
        .inTable('collections')
        .onDelete('SET NULL')
      table.uuid('page_id').nullable().references('id').inTable('pages').onDelete('SET NULL')
      table.string('url', 500).nullable()
      table.string('image', 500).nullable()
      table.integer('position').notNullable().defaultTo(0)
      table.boolean('is_visible').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['collection_id'])
      table.index(['page_id'])
      table.index(['position'])
      table.index(['is_visible', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
