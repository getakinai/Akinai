import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_zone_regions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('shipping_zone_id')
        .notNullable()
        .references('id')
        .inTable('shipping_zones')
        .onDelete('CASCADE')
      table.string('country_code', 2).notNullable()
      table.string('region_code', 10).notNullable().unique()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['shipping_zone_id'])
      table.index(['country_code', 'region_code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
