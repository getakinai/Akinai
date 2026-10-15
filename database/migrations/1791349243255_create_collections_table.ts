import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'collections'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('title', 255).notNullable()
      table.string('slug', 255).notNullable().unique()
      table.text('description').nullable()
      table.string('type', 20).notNullable()
      table.string('match', 10).notNullable().defaultTo('all')
      table.string('sort_order', 20).notNullable()
      table.string('seo_title', 70).nullable()
      table.string('seo_description', 320).nullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status', 'type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
