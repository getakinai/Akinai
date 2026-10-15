import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'newsletter_subscribers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('email', 254).notNullable().unique()
      table.string('source', 20).notNullable()
      table.boolean('is_subscribed').notNullable().defaultTo(true)
      table.timestamp('subscribed_at').notNullable()
      table.timestamp('unsubscribed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['subscribed_at'])
      table.index(['is_subscribed', 'subscribed_at'])
      table.index(['source', 'subscribed_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
