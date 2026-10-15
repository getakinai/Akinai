import type { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { HelpIcon } from '#constants/help'
import HelpCategory from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type HelpCategoryData = {
  slug: string
  title: string
  description: string
  icon: HelpIcon
  popular: boolean
  position: number
}

/** A group to keep: `id` for an existing one, otherwise a new `slug`. */
export type HelpCategoryGroupData = {
  id: string | null
  slug: string
  title: string
  position: number
}

export type HelpCategorySortKey = 'title' | 'position' | 'articlesCount' | 'updatedAt'

export type PaginateHelpCategoriesData = {
  q?: string
  status?: 'active' | 'archived'
  sort: HelpCategorySortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<HelpCategorySortKey, string> = {
  title: 'title',
  position: 'position',
  articlesCount: 'articles_count',
  updatedAt: 'updated_at',
}

const MAX_OPTIONS = 200

export default class HelpCategoryRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateHelpCategoriesData) {
    return HelpCategory.query()
      .withCount('articles', (query) => query.whereNot('status', 'archived'))
      .preload('groups', (query) => query.orderBy('position', 'asc').orderBy('title', 'asc'))
      .if(q, (query) => query.whereILike('title', containsPattern(q)))
      .if(status === 'active', (query) => query.whereNull('archived_at'))
      .if(status === 'archived', (query) => query.whereNotNull('archived_at'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<HelpCategory> {
    return HelpCategory.query()
      .where('id', id)
      .withCount('articles', (query) => query.whereNot('status', 'archived'))
      .preload('groups', (query) => query.orderBy('position', 'asc').orderBy('title', 'asc'))
      .firstOrFail()
  }

  async findBySlug(slug: string): Promise<HelpCategory | null> {
    return HelpCategory.findBy('slug', slug)
  }

  /** Categories (with their groups) staff can file an article under. */
  async options(): Promise<HelpCategory[]> {
    return HelpCategory.query()
      .select('id', 'slug', 'title', 'archived_at', 'position')
      .whereNull('archived_at')
      .preload('groups', (query) =>
        query
          .select('id', 'help_category_id', 'slug', 'title', 'position')
          .orderBy('position', 'asc')
      )
      .orderBy('position', 'asc')
      .orderBy('title', 'asc')
      .limit(MAX_OPTIONS)
  }

  async hasActiveArticles(category: HelpCategory): Promise<boolean> {
    const row = await db
      .from('help_articles')
      .where('help_category_id', category.id)
      .where('status', 'active')
      .select('id')
      .first()
    return Boolean(row)
  }

  async create(data: HelpCategoryData, groups: HelpCategoryGroupData[]): Promise<HelpCategory> {
    const category = await db.transaction(async (trx) => {
      const created = await HelpCategory.create({ ...data, archivedAt: null }, { client: trx })
      if (groups.length > 0) {
        await HelpCategoryGroup.createMany(
          groups.map((group) => ({
            helpCategoryId: created.id,
            slug: group.slug,
            title: group.title,
            position: group.position,
          })),
          { client: trx }
        )
      }
      return created
    })
    return this.findOrFail(category.id)
  }

  /**
   * Saves the category and replaces its groups: groups left out are
   * deleted (their articles become ungrouped), kept ones are updated in one
   * statement, and new ones are inserted.
   */
  async update(
    category: HelpCategory,
    data: HelpCategoryData,
    groups: HelpCategoryGroupData[]
  ): Promise<HelpCategory> {
    await db.transaction(async (trx) => {
      category.useTransaction(trx)
      await category.merge(data).save()

      const kept = groups.flatMap((group) => (group.id ? [{ ...group, id: group.id }] : []))
      const added = groups.filter((group) => group.id === null)
      const keptIds = kept.map((group) => group.id)

      await HelpCategoryGroup.query({ client: trx })
        .where('help_category_id', category.id)
        .if(keptIds.length > 0, (query) => query.whereNotIn('id', keptIds))
        .delete()

      if (kept.length > 0) {
        const whens = kept.map(() => 'WHEN ? THEN ?').join(' ')
        await trx
          .from('help_category_groups')
          .where('help_category_id', category.id)
          .whereIn('id', keptIds)
          .update({
            title: trx.raw(
              `CASE id ${whens} END`,
              kept.flatMap((group) => [group.id, group.title])
            ),
            position: trx.raw(
              `CASE id ${kept.map(() => 'WHEN ? THEN ?::integer').join(' ')} END`,
              kept.flatMap((group) => [group.id, group.position])
            ),
            updated_at: new Date(),
          })
      }

      if (added.length > 0) {
        await HelpCategoryGroup.createMany(
          added.map((group) => ({
            helpCategoryId: category.id,
            slug: group.slug,
            title: group.title,
            position: group.position,
          })),
          { client: trx }
        )
      }
    })
    return this.findOrFail(category.id)
  }

  async setArchivedAt(category: HelpCategory, archivedAt: DateTime | null): Promise<HelpCategory> {
    await category.merge({ archivedAt }).save()
    return this.findOrFail(category.id)
  }

  /**
   * Archives or restores the categories in `ids`, skipping ones already in
   * that state. Categories that still have active articles are never
   * archived.
   */
  async setArchivedMany(ids: string[], archivedAt: DateTime | null): Promise<HelpCategory[]> {
    return bulkUpdate(HelpCategory, ids, { archivedAt }, (query) => {
      if (archivedAt) {
        query
          .whereNull('archived_at')
          .whereNotExists((sub) =>
            sub
              .from('help_articles')
              .whereColumn('help_articles.help_category_id', 'help_categories.id')
              .where('help_articles.status', 'active')
          )
      } else {
        query.whereNotNull('archived_at')
      }
    })
  }
}
