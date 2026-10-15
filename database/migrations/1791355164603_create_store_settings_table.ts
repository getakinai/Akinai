import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('business_country_code', 2).nullable()
      table.string('business_type', 32).nullable()
      table.string('legal_name', 150).nullable()
      table.string('owner_first_name', 100).nullable()
      table.string('owner_last_name', 100).nullable()
      table.date('owner_date_of_birth').nullable()
      table.string('owner_email', 254).nullable()
      table.string('owner_phone_country_code', 2).nullable()
      table.string('owner_phone', 20).nullable()
      table.string('owner_address_line1', 255).nullable()
      table.string('owner_suburb', 100).nullable()
      table.string('owner_city', 100).nullable()
      table.string('owner_region', 100).nullable()
      table.string('owner_postal_code', 20).nullable()

      table.string('store_name', 100).notNullable()
      table.string('contact_email', 254).nullable()
      table.string('phone_country_code', 2).nullable()
      table.string('phone', 20).nullable()

      table.string('store_address_line1', 255).nullable()
      table.string('store_suburb', 100).nullable()
      table.string('store_city', 100).nullable()
      table.string('store_region', 100).nullable()
      table.string('store_postal_code', 20).nullable()
      table.string('store_country_code', 2).nullable()

      table.string('currency_code', 3).notNullable()
      table.string('currency_display', 16).notNullable()
      table.string('locale', 16).notNullable()
      table.string('date_format', 16).notNullable()
      table.string('timezone', 64).notNullable()
      table.string('unit_system', 16).notNullable()
      table.string('weight_unit', 4).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
