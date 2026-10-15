import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_themes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('preset', 32).notNullable()
      table.string('primary_color', 7).notNullable()
      table.string('primary_foreground_color', 7).notNullable()
      table.string('accent_color', 7).notNullable()
      table.string('background_color', 7).notNullable()
      table.string('surface_color', 7).notNullable()
      table.string('text_color', 7).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
