import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('checkout_delivery_heading', 120).nullable()
      table.string('checkout_delivery_note', 500).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('checkout_delivery_heading')
      table.dropColumn('checkout_delivery_note')
    })
  }
}
