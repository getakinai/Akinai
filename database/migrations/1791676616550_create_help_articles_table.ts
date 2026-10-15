import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'help_articles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('help_category_id')
        .notNullable()
        .references('id')
        .inTable('help_categories')
        .onDelete('RESTRICT')
      table
        .uuid('help_category_group_id')
        .nullable()
        .references('id')
        .inTable('help_category_groups')
        .onDelete('SET NULL')
      table.string('slug', 100).notNullable().unique()
      table.string('title', 160).notNullable()
      table.string('description', 300).notNullable()
      table.jsonb('keywords').notNullable().defaultTo('[]')
      table.text('body_markdown').notNullable()
      table.text('body_html').notNullable()
      table.text('body_text').notNullable()
      table.jsonb('body_paragraphs').notNullable().defaultTo('[]')
      table.boolean('popular').notNullable().defaultTo(false)
      table.integer('position').notNullable().defaultTo(0)
      table.string('cta_label', 60).nullable()
      table.string('cta_href', 200).nullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['help_category_id', 'position'])
      table.index(['help_category_group_id'])
      table.index(['status', 'updated_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
