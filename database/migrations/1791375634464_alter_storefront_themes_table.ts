import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_themes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('brand_name', 80).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('brand_name')
    })
  }
}
