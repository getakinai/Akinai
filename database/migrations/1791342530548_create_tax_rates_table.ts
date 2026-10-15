import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tax_rates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('name', 100).notNullable()
      table.string('country_code', 2).notNullable()
      table.string('region_code', 10).nullable()
      table.decimal('rate', 7, 4).notNullable()
      table.boolean('applies_to_shipping').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['country_code', 'region_code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
