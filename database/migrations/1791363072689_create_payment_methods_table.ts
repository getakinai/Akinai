import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_methods'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('code', 32).notNullable().unique()
      table.boolean('is_enabled').notNullable().defaultTo(false)
      table.json('config').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['is_enabled'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
