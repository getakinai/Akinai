import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_levels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('product_variant_id')
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table
        .uuid('location_id')
        .notNullable()
        .references('id')
        .inTable('locations')
        .onDelete('RESTRICT')
      table.integer('available').notNullable().defaultTo(0)
      table.integer('committed').notNullable().defaultTo(0)
      table.integer('incoming').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['product_variant_id', 'location_id'])
      table.index(['location_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
