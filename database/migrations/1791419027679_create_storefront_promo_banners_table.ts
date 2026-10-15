import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_promo_banners'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('placement', 24).notNullable()
      table.string('eyebrow', 40).nullable()
      table.string('title', 100).notNullable()
      table.string('button_label', 30).nullable()
      table.string('tone', 16).notNullable().defaultTo('primary')
      table.string('type', 16).notNullable()
      table
        .uuid('collection_id')
        .nullable()
        .references('id')
        .inTable('collections')
        .onDelete('SET NULL')
      table.string('url', 500).nullable()
      table.string('image', 500).nullable()
      table.integer('position').notNullable().defaultTo(0)
      table.boolean('is_visible').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['collection_id'])
      table.index(['placement', 'is_visible', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
