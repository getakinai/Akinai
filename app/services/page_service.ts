import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import { errors } from '@vinejs/vine'
import Page, { type PageStatus, type PolicyType } from '#models/page'
import PageRepository, {
  type PageData,
  type PaginatePagesData,
} from '#repositories/page_repository'
import type { BulkStatusSource } from '#repositories/helpers/bulk_update'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { blankToNull } from '#utils/blank_to_null'
import { sanitizeEditorHtml } from '#utils/sanitize_rich_text'

export type ListPagesFilters = Partial<PaginatePagesData>

export type PageInput = {
  title: string
  body: string | null
  status: Exclude<PageStatus, 'archived'>
  slug?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  policyType?: PolicyType | null
}

const MAX_LINKABLE_PAGES = 200

@inject()
export default class PageService {
  constructor(
    protected pageRepository: PageRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListPagesFilters = {}) {
    return this.pageRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'updatedAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  async findOrFail(id: string): Promise<Page> {
    return this.pageRepository.findOrFail(id)
  }

  async findPublicBySlugOrFail(slug: string): Promise<Page> {
    return this.pageRepository.findActiveBySlugOrFail(slug)
  }

  async linkable(): Promise<Page[]> {
    return this.pageRepository.linkable(MAX_LINKABLE_PAGES)
  }

  async policies(): Promise<Page[]> {
    return this.pageRepository.activePolicies()
  }

  /**
   * Taking a policy slot moves it from the page that held it.
   */
  async create(input: PageInput): Promise<Page> {
    const slug = await this.resolveSlug(input.slug, input.title)
    const data: PageData = {
      title: input.title,
      slug,
      body: sanitizeEditorHtml(input.body),
      seoTitle: blankToNull(input.seoTitle),
      seoDescription: blankToNull(input.seoDescription),
      status: input.status,
      policyType: input.policyType ?? null,
    }
    return this.pageRepository.create(data)
  }

  /**
   * The slug only changes when one is given, so editing the title doesn't
   * break existing links.
   */
  async update(page: Page, input: PageInput): Promise<Page> {
    const data: Partial<PageData> = {
      title: input.title,
      body: sanitizeEditorHtml(input.body),
      status: input.status,
    }
    if (input.seoTitle !== undefined) data.seoTitle = blankToNull(input.seoTitle)
    if (input.seoDescription !== undefined) data.seoDescription = blankToNull(input.seoDescription)
    if (input.policyType !== undefined) data.policyType = input.policyType
    if (blankToNull(input.slug)) {
      data.slug = await this.resolveSlug(input.slug, input.title, page.id)
    }
    return this.pageRepository.update(page, data)
  }

  async archive(page: Page): Promise<Page> {
    return this.pageRepository.setStatus(page, 'archived', DateTime.now())
  }

  /**
   * Unarchived pages return as drafts so they are not published by accident.
   */
  async unarchive(page: Page): Promise<Page> {
    return this.pageRepository.setStatus(page, 'draft', null)
  }

  /**
   * Publishes or unpublishes many pages, restoring archived ones to that
   * status. Ones already at `status` are skipped.
   */
  async bulkSetStatus(ids: string[], status: Exclude<PageStatus, 'archived'>): Promise<BulkResult> {
    return this.setStatusMany(ids, 'any', status, null)
  }

  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    return archived
      ? this.setStatusMany(ids, 'unarchived', 'archived', DateTime.now())
      : this.setStatusMany(ids, 'archived', 'draft', null)
  }

  protected async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: PageStatus,
    archivedAt: DateTime | null
  ): Promise<BulkResult> {
    const changed = await this.pageRepository.setStatusMany(ids, from, status, archivedAt)
    await this.auditLogService.recordBulkUpdate(Page, changed, { status, archivedAt })
    return bulkResult(ids, changed)
  }

  protected async resolveSlug(
    requested: string | null | undefined,
    title: string,
    ignoreId?: string
  ): Promise<string> {
    const custom = blankToNull(requested)
    if (custom) {
      const slug = string.slug(custom, { lower: true, strict: true })
      if (!slug) {
        throw new errors.E_VALIDATION_ERROR([
          { field: 'slug', message: 'Use letters or numbers in the URL handle', rule: 'slug' },
        ])
      }
      const existing = await this.pageRepository.findBySlug(slug)
      if (existing && existing.id !== ignoreId) {
        throw new errors.E_VALIDATION_ERROR([
          { field: 'slug', message: 'This URL handle is already in use', rule: 'unique' },
        ])
      }
      return slug
    }

    return this.uniqueSlug(title, ignoreId)
  }

  protected async uniqueSlug(title: string, ignoreId?: string): Promise<string> {
    const base = string.slug(title, { lower: true, strict: true }) || 'page'
    let slug = base
    let suffix = 2

    for (;;) {
      const existing = await this.pageRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) return slug
      slug = `${base}-${suffix++}`
    }
  }
}
