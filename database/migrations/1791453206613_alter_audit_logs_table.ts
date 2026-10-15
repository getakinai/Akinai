import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['auditable_type', 'auditable_id', 'action', 'created_at'])
      table.index(['user_id', 'action', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['auditable_type', 'auditable_id', 'action', 'created_at'])
      table.dropIndex(['user_id', 'action', 'created_at'])
    })
  }
}
