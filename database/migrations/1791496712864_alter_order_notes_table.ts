import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_notes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('user_id')
      table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('CASCADE')
      table.uuid('parent_id').nullable().references('id').inTable('order_notes').onDelete('CASCADE')

      table.index(['customer_id'])
      table.index(['parent_id', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['parent_id', 'created_at'])
      table.dropIndex(['customer_id'])
      table.dropColumn('parent_id')
      table.dropColumn('customer_id')
      table.dropNullable('user_id')
    })
  }
}
