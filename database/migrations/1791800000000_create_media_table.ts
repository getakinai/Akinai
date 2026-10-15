import { BaseSchema } from '@adonisjs/lucid/schema'
import { v7 as uuidv7 } from 'uuid'

/**
 * Columns that already hold Drive keys, indexed so existing uploads show in
 * the gallery. Tables owned by a plugin may not exist yet: plugin migrations
 * run after every core migration.
 */
const IMAGE_COLUMNS = [
  { table: 'vendors', column: 'image' },
  { table: 'collections', column: 'image' },
  { table: 'storefront_themes', column: 'logo_image' },
  { table: 'storefront_hero_slides', column: 'image' },
  { table: 'storefront_promo_banners', column: 'image' },
  { table: 'products', column: 'cover_image' },
  { table: 'product_images', column: 'path' },
]

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('key', 255).notNullable().unique()
      table.string('folder', 255).notNullable()
      table.string('content_type', 50).notNullable()
      table.integer('size_bytes').nullable()
      table.integer('width').nullable()
      table.integer('height').nullable()
      table.string('original_name', 255).nullable()
      table.uuid('uploaded_by_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['created_at'])
      table.index(['folder', 'created_at'])
    })

    this.defer(async (db) => {
      const keys = new Set<string>()
      for (const { table, column } of IMAGE_COLUMNS) {
        if (!(await db.schema.hasTable(table))) continue
        const rows: Record<string, string>[] = await db
          .from(table)
          .whereNotNull(column)
          .select(column)
        for (const row of rows) keys.add(row[column])
      }
      if (keys.size === 0) return

      const now = new Date()
      const rows = [...keys].map((key) => {
        const slash = key.lastIndexOf('/')
        const extension = key.split('.').pop()?.toLowerCase() ?? ''
        return {
          id: uuidv7(),
          key,
          folder: slash > 0 ? key.slice(0, slash) : '',
          content_type: CONTENT_TYPES[extension] ?? 'application/octet-stream',
          created_at: now,
          updated_at: now,
        }
      })
      await db.knexQuery().table('media').insert(rows).onConflict('key').ignore()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
