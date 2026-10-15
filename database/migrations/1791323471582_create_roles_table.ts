import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('name', 64).notNullable().unique()
      table.string('slug', 64).notNullable().unique()
      table.string('description', 255).nullable()
      table.boolean('is_locked').notNullable().defaultTo(false)
      table.boolean('is_default').notNullable().defaultTo(false)
      table.integer('sort_order').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
