import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_line_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fulfilled_quantity').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fulfilled_quantity')
    })
  }
}
