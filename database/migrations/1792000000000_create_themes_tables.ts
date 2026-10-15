import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('themes', (table) => {
      table.uuid('id').primary()
      table.string('key', 60).notNullable()
      table.string('name', 120).notNullable()
      table.string('version', 40).notNullable()
      table.string('author', 120).nullable()
      table.text('description').nullable()
      table.string('role', 20).notNullable().defaultTo('unpublished')
      table.string('source', 20).notNullable()
      table.string('drive_key', 255).notNullable()
      table.string('package_hash', 64).notNullable()
      table.jsonb('manifest').notNullable()
      table.jsonb('settings_schema').notNullable()
      table.jsonb('section_schemas').notNullable()
      table.string('preview_image', 255).nullable()
      table.uuid('uploaded_by_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('published_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['key'])
    })
    this.schema.raw(`CREATE UNIQUE INDEX themes_one_live ON themes (role) WHERE role = 'live'`)

    this.schema.createTable('theme_settings', (table) => {
      table.uuid('id').primary()
      table
        .uuid('theme_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('themes')
        .onDelete('CASCADE')
      table.jsonb('data').notNullable()
      table.jsonb('draft_data').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('theme_templates', (table) => {
      table.uuid('id').primary()
      table.uuid('theme_id').notNullable().references('id').inTable('themes').onDelete('CASCADE')
      table.string('name', 80).notNullable()
      table.jsonb('data').notNullable()
      table.jsonb('draft_data').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['theme_id', 'name'])
    })
  }

  async down() {
    this.schema.dropTable('theme_templates')
    this.schema.dropTable('theme_settings')
    this.schema.dropTable('themes')
  }
}
