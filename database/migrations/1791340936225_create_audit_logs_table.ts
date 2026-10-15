import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 20).notNullable()
      table.string('auditable_type', 100).notNullable()
      table.uuid('auditable_id').notNullable()
      table.string('auditable_label').nullable()
      table.jsonb('changes').notNullable()
      table.string('ip_address', 45).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'created_at'])
      table.index(['auditable_type', 'auditable_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
