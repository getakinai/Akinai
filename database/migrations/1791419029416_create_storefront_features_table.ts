import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_features'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('icon', 32).notNullable()
      table.string('title', 40).notNullable()
      table.string('text', 120).notNullable()
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
