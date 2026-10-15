import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('cancelled_at').nullable()
      table.string('cancel_reason', 20).nullable()
      table.decimal('refunded_total', 12, 2).notNullable().defaultTo(0)

      table.index(['status', 'cancelled_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'cancelled_at'])
      table.dropColumn('refunded_total')
      table.dropColumn('cancel_reason')
      table.dropColumn('cancelled_at')
    })
  }
}
