import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_options'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['option_definition_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['option_definition_id'])
    })
  }
}
