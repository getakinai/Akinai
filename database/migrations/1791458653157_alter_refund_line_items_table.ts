import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'refund_line_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Units of `quantity` that had not shipped, so a failed refund can be reversed exactly.
      table.integer('removed_quantity').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('removed_quantity')
    })
  }
}
