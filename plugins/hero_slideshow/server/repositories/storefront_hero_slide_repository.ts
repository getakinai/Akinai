import db from '@adonisjs/lucid/services/db'
import StorefrontHeroSlide from '../models/storefront_hero_slide.js'
import type { MenuItemType } from '#constants/storefront'

export type StorefrontHeroSlideData = {
  eyebrow: string | null
  heading: string
  subheading: string | null
  buttonLabel: string | null
  type: MenuItemType
  collectionId: string | null
  pageId: string | null
  url: string | null
  isVisible: boolean
}

export default class StorefrontHeroSlideRepository {
  async list(): Promise<StorefrontHeroSlide[]> {
    return StorefrontHeroSlide.query()
      .preload('collection')
      .preload('page')
      .orderBy('position', 'asc')
      .orderBy('created_at', 'asc')
  }

  /**
   * Visible slides whose target still exists: URL slides, and collection
   * slides linked to an active collection.
   */
  async listPublic(): Promise<StorefrontHeroSlide[]> {
    return StorefrontHeroSlide.query()
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

  async withImage(key: string): Promise<StorefrontHeroSlide[]> {
    return StorefrontHeroSlide.query().where('image', key).select('id', 'heading')
  }

  async count(): Promise<number> {
    const result = await StorefrontHeroSlide.query().count('* as total').first()
    return Number(result?.$extras.total ?? 0)
  }

  async findOrFail(id: string): Promise<StorefrontHeroSlide> {
    return StorefrontHeroSlide.query()
      .where('id', id)
      .preload('collection')
      .preload('page')
      .firstOrFail()
  }

  async ids(): Promise<string[]> {
    const rows = await StorefrontHeroSlide.query().select('id')
    return rows.map(({ id }) => id)
  }

  /**
   * Appends the slide after the last one.
   */
  async create(data: StorefrontHeroSlideData): Promise<StorefrontHeroSlide> {
    return db.transaction(async (trx) => {
      const last = await StorefrontHeroSlide.query({ client: trx }).max('position as max').first()
      const max = last?.$extras.max
      const position = max === null || max === undefined ? 0 : Number(max) + 1
      const slide = await StorefrontHeroSlide.create({ ...data, position }, { client: trx })
      await slide.load('collection')
      await slide.load('page')
      return slide
    })
  }

  async update(
    slide: StorefrontHeroSlide,
    data: Partial<StorefrontHeroSlideData> & { image?: string | null }
  ): Promise<StorefrontHeroSlide> {
    await slide.merge(data).save()
    await slide.load('collection')
    await slide.load('page')
    return slide
  }

  async delete(slide: StorefrontHeroSlide): Promise<void> {
    await slide.delete()
  }

  /**
   * Sets each slide's position to its index in `ids`, in one statement.
   */
  async reorder(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const cases = ids.map(() => 'when ? then cast(? as integer)').join(' ')
    await StorefrontHeroSlide.query()
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
