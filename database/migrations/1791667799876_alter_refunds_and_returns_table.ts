import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('refunds', (table) => {
      table.index(['status', 'created_at'])
    })
    this.schema.alterTable('returns', (table) => {
      table.index(['requested_at'])
    })
  }

  async down() {
    this.schema.alterTable('returns', (table) => {
      table.dropIndex(['requested_at'])
    })
    this.schema.alterTable('refunds', (table) => {
      table.dropIndex(['status', 'created_at'])
    })
  }
}
