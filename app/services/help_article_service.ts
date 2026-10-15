import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors } from '@vinejs/vine'
import type { HelpArticleStatus } from '#constants/help'
import HelpArticle from '#models/help_article'
import type HelpCategory from '#models/help_category'
import HelpArticleRepository, {
  type HelpArticleData,
  type PaginateHelpArticlesData,
} from '#repositories/help_article_repository'
import HelpCategoryRepository from '#repositories/help_category_repository'
import type { BulkStatusSource } from '#repositories/helpers/bulk_update'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { blankToNull } from '#utils/blank_to_null'
import { renderHelpMarkdown } from '#utils/help_markdown'

export type ListHelpArticlesFilters = Partial<PaginateHelpArticlesData>

export type HelpArticleInput = {
  title: string
  slug?: string | null
  description: string
  categoryId: string
  groupId: string | null
  keywords: string[]
  bodyMarkdown: string
  popular: boolean
  position: number
  ctaLabel: string | null
  ctaHref: string | null
  status: Exclude<HelpArticleStatus, 'archived'>
  relatedIds: string[]
}

const fieldError = (field: string, message: string, rule = 'exists') =>
  new errors.E_VALIDATION_ERROR([{ field, message, rule }])

@inject()
export default class HelpArticleService {
  constructor(
    protected helpArticleRepository: HelpArticleRepository,
    protected helpCategoryRepository: HelpCategoryRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListHelpArticlesFilters = {}) {
    return this.helpArticleRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      categoryId: filters.categoryId,
      sort: filters.sort ?? 'updatedAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  async findOrFail(id: string): Promise<HelpArticle> {
    return this.helpArticleRepository.findOrFail(id)
  }

  async options(): Promise<HelpArticle[]> {
    return this.helpArticleRepository.options()
  }

  /** The storefront HTML for a markdown draft, from the same sanitizer used on save. */
  preview(markdown: string): string {
    return renderHelpMarkdown(markdown).html
  }

  async create(input: HelpArticleInput): Promise<HelpArticle> {
    const data = await this.prepare(input)
    const slug = await this.resolveSlug(input.slug, input.title)
    return this.helpArticleRepository.create({ ...data, slug }, input.relatedIds)
  }

  /**
   * The slug only changes when one is given, so editing the title doesn't
   * break storefront links or the help chat's answers.
   */
  async update(article: HelpArticle, input: HelpArticleInput): Promise<HelpArticle> {
    const data: Partial<HelpArticleData> = await this.prepare(input, article.id)
    if (blankToNull(input.slug)) {
      data.slug = await this.resolveSlug(input.slug, input.title, article.id)
    }
    return this.helpArticleRepository.update(article, data, input.relatedIds)
  }

  async archive(article: HelpArticle): Promise<HelpArticle> {
    return this.helpArticleRepository.setStatus(article, 'archived', DateTime.now())
  }

  /** Unarchived articles return as drafts so they are not published by accident. */
  async unarchive(article: HelpArticle): Promise<HelpArticle> {
    return this.helpArticleRepository.setStatus(article, 'draft', null)
  }

  async bulkSetStatus(
    ids: string[],
    status: Exclude<HelpArticleStatus, 'archived'>
  ): Promise<BulkResult> {
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
    status: HelpArticleStatus,
    archivedAt: DateTime | null
  ): Promise<BulkResult> {
    const changed = await this.helpArticleRepository.setStatusMany(ids, from, status, archivedAt)
    await this.auditLogService.recordBulkUpdate(HelpArticle, changed, { status, archivedAt })
    return bulkResult(ids, changed)
  }

  /**
   * Checks the category, section and related articles, and renders the
   * markdown to the sanitized HTML, text and paragraphs the storefront and
   * help chat read.
   */
  protected async prepare(
    input: HelpArticleInput,
    articleId?: string
  ): Promise<Omit<HelpArticleData, 'slug'>> {
    const category = await this.findCategory(input.categoryId)
    if (input.groupId && !category.groups.some((group) => group.id === input.groupId)) {
      throw fieldError('groupId', 'Pick a section from this category')
    }

    if (articleId && input.relatedIds.includes(articleId)) {
      throw fieldError('relatedIds', 'An article can’t be related to itself', 'distinct')
    }
    const found = new Set(await this.helpArticleRepository.existingIds(input.relatedIds))
    if (input.relatedIds.some((id) => !found.has(id))) {
      throw fieldError('relatedIds', 'One of the related articles no longer exists')
    }

    const ctaLabel = blankToNull(input.ctaLabel)
    const ctaHref = blankToNull(input.ctaHref)
    if (Boolean(ctaLabel) !== Boolean(ctaHref)) {
      throw fieldError(
        ctaLabel ? 'ctaHref' : 'ctaLabel',
        'Enter both the button text and its link, or neither',
        'required'
      )
    }

    const rendered = renderHelpMarkdown(input.bodyMarkdown)
    return {
      helpCategoryId: category.id,
      helpCategoryGroupId: input.groupId,
      title: input.title,
      description: input.description,
      keywords: input.keywords,
      bodyMarkdown: input.bodyMarkdown,
      bodyHtml: rendered.html,
      bodyText: rendered.text,
      bodyParagraphs: rendered.paragraphs,
      popular: input.popular,
      position: input.position,
      ctaLabel,
      ctaHref,
      status: input.status,
    }
  }

  protected async findCategory(id: string): Promise<HelpCategory> {
    try {
      const category = await this.helpCategoryRepository.findOrFail(id)
      if (category.isArchived) throw fieldError('categoryId', 'This category is archived')
      return category
    } catch (error) {
      if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
        throw fieldError('categoryId', 'Pick a category')
      }
      throw error
    }
  }

  protected async resolveSlug(
    requested: string | null | undefined,
    title: string,
    ignoreId?: string
  ): Promise<string> {
    const custom = blankToNull(requested)
    if (custom) {
      const slug = string.slug(custom, { lower: true, strict: true })
      if (!slug) throw fieldError('slug', 'Use letters or numbers in the URL handle', 'slug')
      const existing = await this.helpArticleRepository.findBySlug(slug)
      if (existing && existing.id !== ignoreId) {
        throw fieldError('slug', 'This URL handle is already in use', 'unique')
      }
      return slug
    }

    const base = string.slug(title, { lower: true, strict: true }) || 'article'
    let slug = base
    for (let suffix = 2; ; suffix++) {
      const existing = await this.helpArticleRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) return slug
      slug = `${base}-${suffix}`
    }
  }
}
