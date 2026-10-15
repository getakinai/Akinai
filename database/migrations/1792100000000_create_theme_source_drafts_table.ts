import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('theme_source_drafts', (table) => {
      table.uuid('id').primary()
      table.uuid('theme_id').notNullable().references('id').inTable('themes').onDelete('CASCADE')
      table.string('path', 512).notNullable()
      table.text('content').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['theme_id', 'path'])
    })
  }

  async down() {
    this.schema.dropTable('theme_source_drafts')
  }
}
