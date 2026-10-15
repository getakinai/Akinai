import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('accepts_marketing').notNullable().defaultTo(false)
      table.timestamp('marketing_consent_at').nullable()
      table.string('marketing_consent_source', 20).nullable()
      table.text('note').nullable()

      table.index(['accepts_marketing'])
      table.index(['country_code'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['accepts_marketing'])
      table.dropIndex(['country_code'])
      table.dropColumn('accepts_marketing')
      table.dropColumn('marketing_consent_at')
      table.dropColumn('marketing_consent_source')
      table.dropColumn('note')
    })
  }
}
