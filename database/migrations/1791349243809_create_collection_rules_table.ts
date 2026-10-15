import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'collection_rules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('collection_id')
        .notNullable()
        .references('id')
        .inTable('collections')
        .onDelete('CASCADE')
      table.string('field', 40).notNullable()
      table.string('operator', 20).notNullable()
      table.string('value', 255).nullable()
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['collection_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
