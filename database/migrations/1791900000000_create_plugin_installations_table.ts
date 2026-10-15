import { BaseSchema } from '@adonisjs/lucid/schema'
import { v7 as uuidv7 } from 'uuid'

export default class extends BaseSchema {
  protected tableName = 'plugin_installations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('key', 60).notNullable().unique()
      table.boolean('is_installed').notNullable().defaultTo(true)
      table.jsonb('settings').nullable()
      table.timestamp('installed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.defer(async (db) => {
      const now = new Date()
      await db
        .knexQuery()
        .table(this.tableName)
        .insert({
          id: uuidv7(),
          key: 'hero_slideshow',
          is_installed: true,
          installed_at: now,
          created_at: now,
          updated_at: now,
        })
        .onConflict('key')
        .ignore()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
