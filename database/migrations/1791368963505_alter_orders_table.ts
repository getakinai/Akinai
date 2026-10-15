import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('calculated_total', 12, 2).nullable()
      table.string('total_override_reason', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('calculated_total')
      table.dropColumn('total_override_reason')
    })
  }
}
