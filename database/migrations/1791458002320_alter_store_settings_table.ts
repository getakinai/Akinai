import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('return_window_days').notNullable().defaultTo(30)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('return_window_days')
    })
  }
}
