import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.integer('draft_number').notNullable().unique()
      table.integer('order_number').nullable().unique()
      table.string('status', 20).notNullable()
      table.string('payment_status', 20).nullable()

      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.string('email', 254).nullable()
      table
        .uuid('shipping_address_id')
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table.jsonb('shipping_address').nullable()

      table.uuid('market_id').nullable().references('id').inTable('markets').onDelete('SET NULL')
      table.string('currency_code', 3).notNullable()
      table.boolean('prices_include_tax').notNullable().defaultTo(false)

      table
        .uuid('discount_id')
        .nullable()
        .references('id')
        .inTable('discounts')
        .onDelete('SET NULL')
      table.string('discount_code', 64).nullable()
      table.string('discount_title', 255).nullable()

      table
        .uuid('shipping_rate_id')
        .nullable()
        .references('id')
        .inTable('shipping_rates')
        .onDelete('SET NULL')
      table.string('shipping_title', 255).nullable()
      table.decimal('shipping_price', 12, 2).nullable()

      table.string('tax_name', 255).nullable()
      table.decimal('tax_rate', 7, 4).nullable()
      table.boolean('tax_applies_to_shipping').notNullable().defaultTo(false)

      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.decimal('discount_total', 12, 2).notNullable().defaultTo(0)
      table.decimal('shipping_total', 12, 2).notNullable().defaultTo(0)
      table.decimal('tax_total', 12, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)

      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status', 'created_at'])
      table.index(['customer_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
