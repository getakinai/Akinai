import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fulfillments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('number').notNullable()
      table.string('status', 20).notNullable()
      table
        .uuid('location_id')
        .nullable()
        .references('id')
        .inTable('locations')
        .onDelete('SET NULL')
      table.string('tracking_company', 100).nullable()
      table.string('tracking_number', 100).nullable()
      table.string('tracking_url', 2048).nullable()
      table.timestamp('cancelled_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['order_id', 'number'])
      table.index(['location_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
