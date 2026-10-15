import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import { errors } from '@vinejs/vine'
import type { HelpIcon } from '#constants/help'
import HelpCategory from '#models/help_category'
import HelpCategoryRepository, {
  type HelpCategoryGroupData,
  type PaginateHelpCategoriesData,
} from '#repositories/help_category_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { blankToNull } from '#utils/blank_to_null'

export type ListHelpCategoriesFilters = Partial<PaginateHelpCategoriesData>

export type HelpCategoryInput = {
  title: string
  slug?: string | null
  description: string
  icon: HelpIcon
  popular: boolean
  position: number
  groups: { id: string | null; title: string; position: number }[]
}

@inject()
export default class HelpCategoryService {
  constructor(
    protected helpCategoryRepository: HelpCategoryRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListHelpCategoriesFilters = {}) {
    return this.helpCategoryRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      sort: filters.sort ?? 'position',
      direction: filters.direction ?? 'asc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  async findOrFail(id: string): Promise<HelpCategory> {
    return this.helpCategoryRepository.findOrFail(id)
  }

  async options(): Promise<HelpCategory[]> {
    return this.helpCategoryRepository.options()
  }

  async hasActiveArticles(category: HelpCategory): Promise<boolean> {
    return this.helpCategoryRepository.hasActiveArticles(category)
  }

  async create(input: HelpCategoryInput): Promise<HelpCategory> {
    const slug = await this.resolveSlug(input.slug, input.title)
    return this.helpCategoryRepository.create(
      {
        slug,
        title: input.title,
        description: input.description,
        icon: input.icon,
        popular: input.popular,
        position: input.position,
      },
      this.groupData(input.groups, [])
    )
  }

  /**
   * The slug only changes when one is given, so renaming a category doesn't
   * break storefront links.
   */
  async update(category: HelpCategory, input: HelpCategoryInput): Promise<HelpCategory> {
    const slug = blankToNull(input.slug)
      ? await this.resolveSlug(input.slug, input.title, category.id)
      : category.slug
    const existing = category.groups
    const known = new Set(existing.map((group) => group.id))
    const unknown = input.groups.findIndex((group) => group.id !== null && !known.has(group.id))
    if (unknown !== -1) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: `groups.${unknown}.id`,
          message: 'This section no longer exists. Reload and try again',
          rule: 'exists',
        },
      ])
    }

    return this.helpCategoryRepository.update(
      category,
      {
        slug,
        title: input.title,
        description: input.description,
        icon: input.icon,
        popular: input.popular,
        position: input.position,
      },
      this.groupData(
        input.groups,
        existing.map((group) => ({ id: group.id, slug: group.slug }))
      )
    )
  }

  async archive(category: HelpCategory): Promise<HelpCategory> {
    return this.helpCategoryRepository.setArchivedAt(category, DateTime.now())
  }

  async unarchive(category: HelpCategory): Promise<HelpCategory> {
    return this.helpCategoryRepository.setArchivedAt(category, null)
  }

  /**
   * Categories with active articles are skipped when archiving, matching
   * the single-category rule in `HelpCategoryPolicy`.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const archivedAt = archived ? DateTime.now() : null
    const changed = await this.helpCategoryRepository.setArchivedMany(ids, archivedAt)
    await this.auditLogService.recordBulkUpdate(HelpCategory, changed, { archivedAt })
    return bulkResult(ids, changed)
  }

  /**
   * Kept groups hold on to their slug; new ones get one from the title
   * that is unique within the category.
   */
  protected groupData(
    groups: HelpCategoryInput['groups'],
    existing: { id: string; slug: string }[]
  ): HelpCategoryGroupData[] {
    const slugById = new Map(existing.map((group) => [group.id, group.slug]))
    const keptIds = new Set(groups.map((group) => group.id).filter(Boolean))
    const taken = new Set(
      existing.filter((group) => keptIds.has(group.id)).map((group) => group.slug)
    )

    return groups.map((group) => {
      if (group.id && slugById.has(group.id)) {
        return {
          id: group.id,
          slug: slugById.get(group.id)!,
          title: group.title,
          position: group.position,
        }
      }
      const base = string.slug(group.title, { lower: true, strict: true }) || 'section'
      let slug = base
      for (let suffix = 2; taken.has(slug); suffix++) slug = `${base}-${suffix}`
      taken.add(slug)
      return { id: null, slug, title: group.title, position: group.position }
    })
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
      const existing = await this.helpCategoryRepository.findBySlug(slug)
      if (existing && existing.id !== ignoreId) {
        throw new errors.E_VALIDATION_ERROR([
          { field: 'slug', message: 'This URL handle is already in use', rule: 'unique' },
        ])
      }
      return slug
    }

    const base = string.slug(title, { lower: true, strict: true }) || 'topic'
    let slug = base
    for (let suffix = 2; ; suffix++) {
      const existing = await this.helpCategoryRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) return slug
      slug = `${base}-${suffix}`
    }
  }
}
