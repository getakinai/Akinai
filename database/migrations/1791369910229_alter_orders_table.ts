import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('fulfillment_status', 20).notNullable().defaultTo('unfulfilled')
      table.timestamp('archived_at').nullable()
      table.index(['status', 'fulfillment_status'])
      table.index(['status', 'archived_at', 'completed_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'archived_at', 'completed_at'])
      table.dropIndex(['status', 'fulfillment_status'])
      table.dropColumn('archived_at')
      table.dropColumn('fulfillment_status')
    })
  }
}
