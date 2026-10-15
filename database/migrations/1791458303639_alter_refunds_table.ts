import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'refunds'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('return_id').nullable().references('id').inTable('returns').onDelete('SET NULL')
      table.index(['return_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['return_id'])
      table.dropForeign(['return_id'])
      table.dropColumn('return_id')
    })
  }
}
