import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('mfa_secret').nullable()
      table.timestamp('mfa_enabled_at').nullable()
      table.json('mfa_recovery_codes').nullable()
      table.integer('mfa_last_time_step').nullable()
      table.integer('session_version').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mfa_secret')
      table.dropColumn('mfa_enabled_at')
      table.dropColumn('mfa_recovery_codes')
      table.dropColumn('mfa_last_time_step')
      table.dropColumn('session_version')
    })
  }
}
