import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_zone_countries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('shipping_zone_id')
        .notNullable()
        .references('id')
        .inTable('shipping_zones')
        .onDelete('CASCADE')
      table.string('country_code', 2).notNullable().unique()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['shipping_zone_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
