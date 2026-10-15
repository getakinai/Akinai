import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_line_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('discount_allocation', 12, 2).notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('discount_allocation')
    })
  }
}
