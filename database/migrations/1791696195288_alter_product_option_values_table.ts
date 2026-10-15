import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_option_values'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['option_definition_value_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['option_definition_value_id'])
    })
  }
}
