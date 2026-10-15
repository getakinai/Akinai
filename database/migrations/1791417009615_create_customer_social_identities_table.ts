import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_social_identities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('customer_account_id')
        .notNullable()
        .references('id')
        .inTable('customer_accounts')
        .onDelete('CASCADE')
      table.string('provider', 32).notNullable()
      table.string('provider_user_id', 255).notNullable()
      table.string('email', 254).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['provider', 'provider_user_id'])
      table.index(['customer_account_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
