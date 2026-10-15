import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.string('permission', 100).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['role_id', 'permission'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
