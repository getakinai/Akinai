import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_rates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('shipping_zone_id')
        .notNullable()
        .references('id')
        .inTable('shipping_zones')
        .onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.decimal('price', 12, 2).notNullable()
      table.decimal('min_subtotal', 12, 2).nullable()
      table.decimal('max_subtotal', 12, 2).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['shipping_zone_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
