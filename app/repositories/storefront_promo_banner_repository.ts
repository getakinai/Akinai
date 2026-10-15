import db from '@adonisjs/lucid/services/db'
import StorefrontPromoBanner from '#models/storefront_promo_banner'
import type { MenuItemType, PromoPlacement, PromoTone } from '#constants/storefront'

export type StorefrontPromoBannerData = {
  eyebrow: string | null
  title: string
  buttonLabel: string | null
  tone: PromoTone
  type: MenuItemType
  collectionId: string | null
  pageId: string | null
  url: string | null
  isVisible: boolean
}

export default class StorefrontPromoBannerRepository {
  async list(): Promise<StorefrontPromoBanner[]> {
    return StorefrontPromoBanner.query()
      .preload('collection')
      .preload('page')
      .orderBy('placement', 'asc')
      .orderBy('position', 'asc')
      .orderBy('created_at', 'asc')
  }

  /**
   * Visible banners whose target still exists: URL banners, and collection
   * banners linked to an active collection.
   */
  async listPublic(): Promise<StorefrontPromoBanner[]> {
    return StorefrontPromoBanner.query()
      .where('is_visible', true)
      .where((group) => {
        group
          .where('type', 'url')
          .orWhereHas('collection', (collection) => collection.where('status', 'active'))
          .orWhereHas('page', (page) => page.where('status', 'active'))
      })
      .preload('collection')
      .preload('page')
      .orderBy('placement', 'asc')
      .orderBy('position', 'asc')
      .orderBy('created_at', 'asc')
  }

  async countIn(placement: PromoPlacement): Promise<number> {
    const result = await StorefrontPromoBanner.query()
      .where('placement', placement)
      .count('* as total')
      .first()
    return Number(result?.$extras.total ?? 0)
  }

  async findOrFail(id: string): Promise<StorefrontPromoBanner> {
    return StorefrontPromoBanner.query()
      .where('id', id)
      .preload('collection')
      .preload('page')
      .firstOrFail()
  }

  async idsIn(placement: PromoPlacement): Promise<string[]> {
    const rows = await StorefrontPromoBanner.query().where('placement', placement).select('id')
    return rows.map(({ id }) => id)
  }

  /**
   * Appends the banner after the last one in its placement.
   */
  async create(
    placement: PromoPlacement,
    data: StorefrontPromoBannerData
  ): Promise<StorefrontPromoBanner> {
    return db.transaction(async (trx) => {
      const last = await StorefrontPromoBanner.query({ client: trx })
        .where('placement', placement)
        .max('position as max')
        .first()
      const max = last?.$extras.max
      const position = max === null || max === undefined ? 0 : Number(max) + 1
      const banner = await StorefrontPromoBanner.create(
        { ...data, placement, position, image: null },
        { client: trx }
      )
      await banner.load('collection')
      await banner.load('page')
      return banner
    })
  }

  async update(
    banner: StorefrontPromoBanner,
    data: Partial<StorefrontPromoBannerData> & { image?: string | null }
  ): Promise<StorefrontPromoBanner> {
    await banner.merge(data).save()
    await banner.load('collection')
    await banner.load('page')
    return banner
  }

  async delete(banner: StorefrontPromoBanner): Promise<void> {
    await banner.delete()
  }

  /**
   * Sets each banner's position to its index in `ids`, in one statement.
   */
  async reorder(placement: PromoPlacement, ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const cases = ids.map(() => 'when ? then cast(? as integer)').join(' ')
    await StorefrontPromoBanner.query()
      .where('placement', placement)
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
