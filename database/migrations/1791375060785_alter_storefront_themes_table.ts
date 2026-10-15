import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_themes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('logo_image', 255).nullable()
      table.string('favicon_folder', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo_image')
      table.dropColumn('favicon_folder')
    })
  }
}
