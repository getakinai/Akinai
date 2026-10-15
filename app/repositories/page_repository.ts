import type { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Page, { POLICY_TYPES, type PageStatus, type PolicyType } from '#models/page'
import { bulkUpdate, type BulkStatusSource } from '#repositories/helpers/bulk_update'
import { escapeLike } from '#repositories/helpers/like'

export type PageData = {
  title: string
  slug: string
  body: string | null
  seoTitle: string | null
  seoDescription: string | null
  status: PageStatus
  policyType: PolicyType | null
}

export type PageSortKey = 'title' | 'status' | 'createdAt' | 'updatedAt'

export type PaginatePagesData = {
  q?: string
  status?: PageStatus
  sort: PageSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<PageSortKey, string> = {
  title: 'title',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

const LIST_COLUMNS = [
  'id',
  'title',
  'slug',
  'status',
  'policy_type',
  'archived_at',
  'created_at',
  'updated_at',
]

export default class PageRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginatePagesData) {
    return Page.query()
      .select(LIST_COLUMNS)
      .if(q, (query) => query.whereILike('title', `%${escapeLike(q!)}%`))
      .if(status, (query) => query.where('status', status!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async findOrFail(id: string): Promise<Page> {
    return Page.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Page | null> {
    return Page.findBy('slug', slug)
  }

  async findActiveBySlug(slug: string): Promise<Page | null> {
    return Page.query()
      .select('id', 'title', 'slug', 'body', 'seo_title', 'seo_description')
      .where('slug', slug)
      .where('status', 'active')
      .first()
  }

  async findActiveBySlugOrFail(slug: string): Promise<Page> {
    return Page.query().where('slug', slug).where('status', 'active').firstOrFail()
  }

  /**
   * Pages staff can link to from the menu, hero slides and promo banners.
   */
  async linkable(limit: number): Promise<Page[]> {
    return Page.query()
      .select('id', 'title', 'slug', 'status')
      .whereNot('status', 'archived')
      .orderBy('title', 'asc')
      .limit(limit)
  }

  /**
   * Active pages that hold a policy slot, in `POLICY_TYPES` order.
   */
  async activePolicies(): Promise<Page[]> {
    const pages = await Page.query()
      .select('id', 'title', 'slug', 'policy_type')
      .whereNotNull('policy_type')
      .where('status', 'active')
    return pages.sort(
      (a, b) => POLICY_TYPES.indexOf(a.policyType!) - POLICY_TYPES.indexOf(b.policyType!)
    )
  }

  /**
   * Creates the page. A policy slot it takes is cleared from the page that
   * held it, in the same transaction.
   */
  async create(data: PageData): Promise<Page> {
    return db.transaction(async (trx) => {
      await this.releasePolicy(data.policyType, null, trx)
      return Page.create({ ...data, archivedAt: null }, { client: trx })
    })
  }

  async update(page: Page, data: Partial<PageData>): Promise<Page> {
    return db.transaction(async (trx) => {
      if (data.policyType !== undefined) await this.releasePolicy(data.policyType, page.id, trx)
      page.useTransaction(trx)
      return page.merge(data).save()
    })
  }

  async setStatus(page: Page, status: PageStatus, archivedAt: DateTime | null): Promise<Page> {
    return page.merge({ status, archivedAt }).save()
  }

  /**
   * Sets the status of the pages in `ids` allowed by `from`, skipping ones
   * already at `status`. Returns the changed rows with their previous
   * values.
   */
  async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: PageStatus,
    archivedAt: DateTime | null
  ): Promise<Page[]> {
    return bulkUpdate(Page, ids, { status, archivedAt }, (query) =>
      query
        .if(from === 'archived', (scoped) => scoped.where('status', 'archived'))
        .if(from === 'unarchived', (scoped) => scoped.whereNot('status', 'archived'))
        .whereNot('status', status)
    )
  }

  protected async releasePolicy(
    policyType: PolicyType | null,
    keepId: string | null,
    trx: TransactionClientContract
  ): Promise<void> {
    if (!policyType) return
    const holder = await Page.query({ client: trx })
      .where('policy_type', policyType)
      .if(keepId, (query) => query.whereNot('id', keepId!))
      .forUpdate()
      .first()
    if (!holder) return
    holder.useTransaction(trx)
    await holder.merge({ policyType: null }).save()
  }
}
