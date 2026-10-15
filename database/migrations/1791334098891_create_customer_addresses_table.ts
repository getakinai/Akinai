import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')
      table.string('full_name').nullable()
      table.string('company').nullable()
      table.string('address1').notNullable()
      table.string('address2').nullable()
      table.string('city').notNullable()
      table.string('province').nullable()
      table.string('postal_code', 20).nullable()
      table.string('country_code', 2).notNullable()
      table.string('phone', 32).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['customer_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
