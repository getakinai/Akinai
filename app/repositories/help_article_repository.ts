import type { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { HelpArticleStatus, HelpIcon } from '#constants/help'
import HelpArticleModel from '#models/help_article'
import HelpArticleRelated from '#models/help_article_related'
import HelpCategoryModel from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'
import { bulkUpdate, type BulkStatusSource } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'

export type HelpGroup = { slug: string; title: string; order: number }

export type HelpCta = { label: string; href: string }

export type HelpArticle = {
  slug: string
  categorySlug: string
  title: string
  description: string
  keywords: string[]
  group: string | null
  order: number
  popular: boolean
  related: string[]
  cta: HelpCta | null
  html: string
  text: string
  paragraphs: string[]
}

export type HelpCategory = {
  slug: string
  title: string
  description: string
  icon: HelpIcon
  popular: boolean
  order: number
  groups: HelpGroup[]
  articles: HelpArticle[]
}

export type HelpLibrary = {
  categories: HelpCategory[]
  articles: HelpArticle[]
}

export type HelpArticleData = {
  helpCategoryId: string
  helpCategoryGroupId: string | null
  slug: string
  title: string
  description: string
  keywords: string[]
  bodyMarkdown: string
  bodyHtml: string
  bodyText: string
  bodyParagraphs: string[]
  popular: boolean
  position: number
  ctaLabel: string | null
  ctaHref: string | null
  status: HelpArticleStatus
}

export type HelpArticleSortKey = 'title' | 'status' | 'position' | 'updatedAt'

export type PaginateHelpArticlesData = {
  q?: string
  status?: HelpArticleStatus
  categoryId?: string
  sort: HelpArticleSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

/** A starter category ready to insert, with rendered article bodies. */
export type HelpImportCategory = {
  slug: string
  title: string
  description: string
  icon: HelpIcon
  popular: boolean
  position: number
  groups: { slug: string; title: string; position: number }[]
  articles: (Omit<HelpArticleData, 'helpCategoryId' | 'helpCategoryGroupId'> & {
    groupSlug: string | null
    relatedSlugs: string[]
  })[]
}

export type HelpImportResult = { categories: number; articles: number }

const sortColumns: Record<HelpArticleSortKey, string> = {
  title: 'help_articles.title',
  status: 'help_articles.status',
  position: 'help_articles.position',
  updatedAt: 'help_articles.updated_at',
}

const LIST_COLUMNS = [
  'id',
  'help_category_id',
  'slug',
  'title',
  'description',
  'popular',
  'position',
  'status',
  'archived_at',
  'created_at',
  'updated_at',
]

const MAX_OPTIONS = 500

const byPositionThenTitle = (
  a: { position: number; title: string },
  b: { position: number; title: string }
) => a.position - b.position || a.title.localeCompare(b.title)

export default class HelpArticleRepository {
  /**
   * The published help center: active articles in categories that aren't
   * archived, in storefront order. Related links to hidden articles are
   * dropped.
   */
  async library(): Promise<HelpLibrary> {
    const [categoryRows, articleRows] = await Promise.all([
      HelpCategoryModel.query()
        .whereNull('archived_at')
        .preload('groups')
        .orderBy('position', 'asc')
        .orderBy('title', 'asc'),
      HelpArticleModel.query()
        .select(
          'id',
          'help_category_id',
          'help_category_group_id',
          'slug',
          'title',
          'description',
          'keywords',
          'body_html',
          'body_text',
          'body_paragraphs',
          'popular',
          'position',
          'cta_label',
          'cta_href'
        )
        .where('status', 'active')
        .whereIn('help_category_id', (query) =>
          query.from('help_categories').select('id').whereNull('archived_at')
        ),
    ])

    const relatedRows: { help_article_id: string; slug: string }[] =
      articleRows.length === 0
        ? []
        : await db
            .from('help_article_related as r')
            .join('help_articles as a', 'a.id', 'r.related_article_id')
            .whereIn(
              'r.help_article_id',
              articleRows.map((row) => row.id)
            )
            .where('a.status', 'active')
            .select('r.help_article_id', 'a.slug')
            .orderBy('r.position', 'asc')

    const visibleSlugs = new Set(articleRows.map((row) => row.slug))
    const relatedByArticle = new Map<string, string[]>()
    for (const row of relatedRows) {
      if (!visibleSlugs.has(row.slug)) continue
      const list = relatedByArticle.get(row.help_article_id) ?? []
      list.push(row.slug)
      relatedByArticle.set(row.help_article_id, list)
    }

    const categories: HelpCategory[] = categoryRows.map((category) => {
      const groupRows = [...category.groups].sort(byPositionThenTitle)
      const groupRank = new Map(groupRows.map((group, index) => [group.id, index]))
      const rank = (row: HelpArticleModel) =>
        row.helpCategoryGroupId
          ? (groupRank.get(row.helpCategoryGroupId) ?? groupRows.length)
          : groupRows.length

      const articles = articleRows
        .filter((row) => row.helpCategoryId === category.id)
        .sort((a, b) => rank(a) - rank(b) || byPositionThenTitle(a, b))
        .map((row): HelpArticle => ({
          slug: row.slug,
          categorySlug: category.slug,
          title: row.title,
          description: row.description,
          keywords: row.keywords ?? [],
          group: groupRows[rank(row)]?.slug ?? null,
          order: row.position,
          popular: row.popular,
          related: relatedByArticle.get(row.id) ?? [],
          cta: row.ctaLabel && row.ctaHref ? { label: row.ctaLabel, href: row.ctaHref } : null,
          html: row.bodyHtml,
          text: row.bodyText,
          paragraphs: row.bodyParagraphs ?? [],
        }))

      return {
        slug: category.slug,
        title: category.title,
        description: category.description,
        icon: category.icon,
        popular: category.popular,
        order: category.position,
        groups: groupRows.map((group) => ({
          slug: group.slug,
          title: group.title,
          order: group.position,
        })),
        articles,
      }
    })

    return {
      categories,
      articles: categories.flatMap((category) => category.articles),
    }
  }

  async paginate({
    q,
    status,
    categoryId,
    sort,
    direction,
    page,
    perPage,
  }: PaginateHelpArticlesData) {
    return HelpArticleModel.query()
      .select(LIST_COLUMNS.map((column) => `help_articles.${column}`))
      .preload('category', (query) => query.select('id', 'slug', 'title'))
      .if(q, (query) =>
        query.where((scoped) =>
          scoped
            .whereILike('help_articles.title', containsPattern(q))
            .orWhereILike('help_articles.slug', containsPattern(q))
        )
      )
      .if(status, (query) => query.where('help_articles.status', status!))
      .if(categoryId, (query) => query.where('help_articles.help_category_id', categoryId!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('help_articles.id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<HelpArticleModel> {
    return HelpArticleModel.query()
      .where('id', id)
      .preload('category', (query) => query.select('id', 'slug', 'title'))
      .preload('relatedLinks', (query) => query.orderBy('position', 'asc'))
      .firstOrFail()
  }

  async findBySlug(slug: string): Promise<HelpArticleModel | null> {
    return HelpArticleModel.findBy('slug', slug)
  }

  /** Articles staff can pick as related, newest titles first. */
  async options(): Promise<HelpArticleModel[]> {
    return HelpArticleModel.query()
      .select('id', 'slug', 'title', 'status')
      .whereNot('status', 'archived')
      .orderBy('title', 'asc')
      .limit(MAX_OPTIONS)
  }

  async existingIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const rows = await HelpArticleModel.query().select('id').whereIn('id', ids)
    return rows.map((row) => row.id)
  }

  async create(data: HelpArticleData, relatedIds: string[]): Promise<HelpArticleModel> {
    const article = await db.transaction(async (trx) => {
      const created = await HelpArticleModel.create({ ...data, archivedAt: null }, { client: trx })
      await this.replaceRelated(created.id, relatedIds, trx)
      return created
    })
    return this.findOrFail(article.id)
  }

  async update(
    article: HelpArticleModel,
    data: Partial<HelpArticleData>,
    relatedIds: string[]
  ): Promise<HelpArticleModel> {
    await db.transaction(async (trx) => {
      article.useTransaction(trx)
      await article.merge(data).save()
      await this.replaceRelated(article.id, relatedIds, trx)
    })
    return this.findOrFail(article.id)
  }

  async setStatus(
    article: HelpArticleModel,
    status: HelpArticleStatus,
    archivedAt: DateTime | null
  ): Promise<HelpArticleModel> {
    await article.merge({ status, archivedAt }).save()
    return this.findOrFail(article.id)
  }

  /**
   * Sets the status of the articles in `ids` allowed by `from`, skipping
   * ones already at `status`. Returns the changed rows as they were.
   */
  async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: HelpArticleStatus,
    archivedAt: DateTime | null
  ): Promise<HelpArticleModel[]> {
    return bulkUpdate(HelpArticleModel, ids, { status, archivedAt }, (query) =>
      query
        .if(from === 'archived', (scoped) => scoped.where('status', 'archived'))
        .if(from === 'unarchived', (scoped) => scoped.whereNot('status', 'archived'))
        .whereNot('status', status)
    )
  }

  /**
   * Inserts the starter categories, groups, articles and related links
   * whose slugs aren't in the database yet. Existing rows are never
   * touched, so staff edits survive re-seeding. Groups are only added to
   * categories created here.
   */
  async insertMissing(content: HelpImportCategory[]): Promise<HelpImportResult> {
    return db.transaction(async (trx) => {
      const categorySlugs = content.map((category) => category.slug)
      const articleSlugs = content.flatMap((category) =>
        category.articles.map((article) => article.slug)
      )

      const [existingCategories, existingArticles] = await Promise.all([
        HelpCategoryModel.query({ client: trx })
          .select('id', 'slug')
          .whereIn('slug', categorySlugs),
        HelpArticleModel.query({ client: trx }).select('id', 'slug').whereIn('slug', articleSlugs),
      ])
      const categoryIds = new Map(existingCategories.map((row) => [row.slug, row.id]))
      const takenArticles = new Set(existingArticles.map((row) => row.slug))

      const newCategories = content.filter((category) => !categoryIds.has(category.slug))
      const createdCategories = await HelpCategoryModel.createMany(
        newCategories.map((category) => ({
          slug: category.slug,
          title: category.title,
          description: category.description,
          icon: category.icon,
          popular: category.popular,
          position: category.position,
          archivedAt: null,
        })),
        { client: trx }
      )
      for (const created of createdCategories) categoryIds.set(created.slug, created.id)

      const createdGroups = await HelpCategoryGroup.createMany(
        newCategories.flatMap((category) =>
          category.groups.map((group) => ({
            helpCategoryId: categoryIds.get(category.slug)!,
            slug: group.slug,
            title: group.title,
            position: group.position,
          }))
        ),
        { client: trx }
      )
      const groupIds = new Map(
        createdGroups.map((group) => [`${group.helpCategoryId}:${group.slug}`, group.id])
      )

      const newArticles = content.flatMap((category) =>
        category.articles
          .filter((article) => !takenArticles.has(article.slug))
          .map((article) => ({ categoryId: categoryIds.get(category.slug)!, article }))
      )
      const createdArticles = await HelpArticleModel.createMany(
        newArticles.map(({ categoryId, article }) => {
          const { groupSlug, relatedSlugs, ...data } = article
          return {
            ...data,
            helpCategoryId: categoryId,
            helpCategoryGroupId: groupSlug
              ? (groupIds.get(`${categoryId}:${groupSlug}`) ?? null)
              : null,
            archivedAt: null,
          }
        }),
        { client: trx }
      )

      const articleIds = new Map([
        ...existingArticles.map((row) => [row.slug, row.id] as const),
        ...createdArticles.map((row) => [row.slug, row.id] as const),
      ])
      await HelpArticleRelated.createMany(
        newArticles.flatMap(({ article }) =>
          article.relatedSlugs.flatMap((slug, position) => {
            const relatedId = articleIds.get(slug)
            return relatedId
              ? [
                  {
                    helpArticleId: articleIds.get(article.slug)!,
                    relatedArticleId: relatedId,
                    position,
                  },
                ]
              : []
          })
        ),
        { client: trx }
      )

      return { categories: createdCategories.length, articles: createdArticles.length }
    })
  }

  protected async replaceRelated(
    articleId: string,
    relatedIds: string[],
    trx: TransactionClientContract
  ): Promise<void> {
    await HelpArticleRelated.query({ client: trx }).where('help_article_id', articleId).delete()
    if (relatedIds.length === 0) return
    await HelpArticleRelated.createMany(
      relatedIds.map((relatedArticleId, position) => ({
        helpArticleId: articleId,
        relatedArticleId,
        position,
      })),
      { client: trx }
    )
  }
}
