import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_reviews'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_featured').notNullable().defaultTo(false)
      table.index(['is_featured', 'is_hidden', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['is_featured', 'is_hidden', 'created_at'])
      table.dropColumn('is_featured')
    })
  }
}
