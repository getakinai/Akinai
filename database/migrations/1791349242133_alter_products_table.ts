import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('product_type', 255).nullable().index()
      table.string('vendor', 255).nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['product_type'])
      table.dropIndex(['vendor'])
      table.dropColumn('product_type')
      table.dropColumn('vendor')
    })
  }
}
