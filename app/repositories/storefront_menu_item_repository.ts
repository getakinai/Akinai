import db from '@adonisjs/lucid/services/db'
import StorefrontMenuItem from '#models/storefront_menu_item'
import type { MenuItemType } from '#constants/storefront'

export type StorefrontMenuItemData = {
  label: string
  type: MenuItemType
  collectionId: string | null
  pageId: string | null
  url: string | null
  isVisible: boolean
}

export default class StorefrontMenuItemRepository {
  async list(): Promise<StorefrontMenuItem[]> {
    return StorefrontMenuItem.query()
      .preload('collection')
      .preload('page')
      .orderBy('position', 'asc')
      .orderBy('created_at', 'asc')
  }

  /**
   * Visible items whose target still exists: URL items, and collection items
   * linked to an active collection.
   */
  async listPublic(): Promise<StorefrontMenuItem[]> {
    return StorefrontMenuItem.query()
      .where('is_visible', true)
      .where((group) => {
        group
          .where('type', 'url')
          .orWhereHas('collection', (collection) => collection.where('status', 'active'))
          .orWhereHas('page', (page) => page.where('status', 'active'))
      })
      .preload('collection')
      .preload('page')
      .orderBy('position', 'asc')
      .orderBy('created_at', 'asc')
  }

  async count(): Promise<number> {
    const result = await StorefrontMenuItem.query().count('* as total').first()
    return Number(result?.$extras.total ?? 0)
  }

  async findOrFail(id: string): Promise<StorefrontMenuItem> {
    return StorefrontMenuItem.query()
      .where('id', id)
      .preload('collection')
      .preload('page')
      .firstOrFail()
  }

  async ids(): Promise<string[]> {
    const rows = await StorefrontMenuItem.query().select('id')
    return rows.map(({ id }) => id)
  }

  /**
   * Appends the item after the last one.
   */
  async create(data: StorefrontMenuItemData): Promise<StorefrontMenuItem> {
    return db.transaction(async (trx) => {
      const last = await StorefrontMenuItem.query({ client: trx }).max('position as max').first()
      const max = last?.$extras.max
      const position = max === null || max === undefined ? 0 : Number(max) + 1
      const item = await StorefrontMenuItem.create({ ...data, position }, { client: trx })
      await item.load('collection')
      await item.load('page')
      return item
    })
  }

  async update(
    item: StorefrontMenuItem,
    data: StorefrontMenuItemData
  ): Promise<StorefrontMenuItem> {
    await item.merge(data).save()
    await item.load('collection')
    await item.load('page')
    return item
  }

  async delete(item: StorefrontMenuItem): Promise<void> {
    await item.delete()
  }

  /**
   * Sets each item's position to its index in `ids`, in one statement.
   */
  async reorder(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const cases = ids.map(() => 'when ? then cast(? as integer)').join(' ')
    await StorefrontMenuItem.query()
      .whereIn('id', ids)
      .update({
        position: db.raw(
          `case id ${cases} end`,
          ids.flatMap((id, position) => [id, position])
        ),
        updated_at: new Date(),
      })
  }
}
