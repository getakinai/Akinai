import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'market_countries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('market_id').notNullable().references('id').inTable('markets').onDelete('CASCADE')
      table.string('country_code', 2).notNullable().unique()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['market_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
