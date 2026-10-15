import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('title', 255).notNullable()
      table.string('slug', 255).notNullable().unique()
      table.text('description').nullable()
      table.enum('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft')
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
