import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('title', 120).notNullable()
      table.string('slug', 255).notNullable().unique()
      table.text('body').nullable()
      table.string('seo_title', 70).nullable()
      table.string('seo_description', 320).nullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.string('policy_type', 16).nullable().unique()
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status', 'updated_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
