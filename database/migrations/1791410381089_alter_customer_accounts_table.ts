import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('session_version').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('session_version')
    })
  }
}
