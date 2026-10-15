import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storefront_themes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('announcement_text', 160).nullable()
      table.string('announcement_url', 500).nullable()
      table.string('footer_tagline', 200).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('announcement_text')
      table.dropColumn('announcement_url')
      table.dropColumn('footer_tagline')
    })
  }
}
