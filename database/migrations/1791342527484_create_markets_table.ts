import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'markets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('name', 100).notNullable().unique()
      table.string('handle', 100).notNullable().unique()
      table.string('currency_code', 3).notNullable()
      table.boolean('prices_include_tax').notNullable().defaultTo(false)
      table.boolean('is_primary').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
