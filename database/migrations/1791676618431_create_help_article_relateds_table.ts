import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'help_article_related'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('help_article_id')
        .notNullable()
        .references('id')
        .inTable('help_articles')
        .onDelete('CASCADE')
      table
        .uuid('related_article_id')
        .notNullable()
        .references('id')
        .inTable('help_articles')
        .onDelete('CASCADE')
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['help_article_id', 'related_article_id'])
      table.index(['related_article_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
