import { BaseSchema } from '@adonisjs/lucid/schema'
import { v7 as uuidv7 } from 'uuid'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const now = new Date()
      await db
        .knexQuery()
        .table('plugin_installations')
        .insert({
          id: uuidv7(),
          key: 'hero_slideshow',
          is_installed: true,
          installed_at: now,
          created_at: now,
          updated_at: now,
        })
        .onConflict('key')
        .ignore()
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from('plugin_installations').where('key', 'hero_slideshow').delete()
    })
  }
}
