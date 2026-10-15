import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('market_id').nullable().references('id').inTable('markets').onDelete('SET NULL')
      table.index(['market_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['market_id'])
      table.dropForeign(['market_id'])
      table.dropColumn('market_id')
    })
  }
}
