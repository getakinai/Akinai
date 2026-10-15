import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_addresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('region_code', 10).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('region_code')
    })
  }
}
