import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import string from '@adonisjs/core/helpers/string'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors } from '@vinejs/vine'
import Collection from '#models/collection'
import type {
  CollectionMatch,
  CollectionSortOrder,
  CollectionStatus,
  CollectionType,
} from '#models/collection'
import {
  COLLECTION_RULE_OPERATORS,
  MAX_COLLECTION_RULES,
  NUMERIC_RULE_FIELDS,
  VALUELESS_RULE_OPERATORS,
  type CollectionRuleData,
} from '#models/collection_rule'
import CollectionRepository, {
  type CollectionData,
  type PaginateCollectionsData,
} from '#repositories/collection_repository'
import type { BulkStatusSource } from '#repositories/helpers/bulk_update'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
import { COLLECTION_IMAGE_FOLDER } from '#constants/storefront'
import { blankToNull } from '#utils/blank_to_null'
import { sanitizeEditorHtml } from '#utils/sanitize_rich_text'
import { deleteImages, uploadImage } from '#utils/uploader'

export type ListCollectionsFilters = Partial<PaginateCollectionsData>

type CollectionFieldsInput = {
  title: string
  description: string | null
  status: Exclude<CollectionStatus, 'archived'>
  match?: CollectionMatch
  sortOrder?: CollectionSortOrder
  slug?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  rules?: CollectionRuleData[]
}

export type CreateCollectionInput = CollectionFieldsInput & {
  type: CollectionType
}

export type UpdateCollectionInput = CollectionFieldsInput

export type PreviewInput = {
  match: CollectionMatch
  sortOrder: CollectionSortOrder
  rules: CollectionRuleData[]
}

export type FieldError = { field: string; message: string; rule: string }

const PREVIEW_LIMIT = 5

export const DEFAULT_SORT_ORDER: Record<CollectionType, CollectionSortOrder> = {
  manual: 'manual',
  automated: 'best_selling',
}

/**
 * Trims rule values and drops them for operators that take no value.
 */
function normalizeRules(rules: CollectionRuleData[]): CollectionRuleData[] {
  return rules.map(({ field, operator, value }) => ({
    field,
    operator,
    value: VALUELESS_RULE_OPERATORS.includes(operator) ? null : (value?.trim() ?? null),
  }))
}

/**
 * Field errors for rules that pair a field with an operator it doesn't
 * support, or that are missing (or have a non-numeric) value.
 */
export function ruleErrors(rules: CollectionRuleData[]): FieldError[] {
  const found: FieldError[] = []

  rules.forEach(({ field, operator, value }, index) => {
    if (!COLLECTION_RULE_OPERATORS[field].includes(operator)) {
      found.push({
        field: `rules.${index}.operator`,
        message: 'This condition is not available for the selected field',
        rule: 'collectionRule',
      })
      return
    }
    if (VALUELESS_RULE_OPERATORS.includes(operator)) return

    const text = value?.trim() ?? ''
    if (text.length === 0) {
      found.push({ field: `rules.${index}.value`, message: 'Enter a value', rule: 'required' })
      return
    }
    if (NUMERIC_RULE_FIELDS.includes(field)) {
      const amount = Number(text)
      if (!Number.isFinite(amount) || amount < 0) {
        found.push({
          field: `rules.${index}.value`,
          message: 'Enter a number of 0 or more',
          rule: 'number',
        })
      }
    }
  })

  return found
}

@inject()
export default class CollectionService {
  constructor(
    protected collectionRepository: CollectionRepository,
    protected auditLogService: AuditLogService
  ) {}

  /**
   * Automated collections get their product count from their rules; manual
   * ones from their entries.
   */
  async paginate(filters: ListCollectionsFilters = {}) {
    const collections = await this.collectionRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      type: filters.type,
      sort: filters.sort ?? 'updatedAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })

    for (const collection of collections.all()) {
      await this.attachProductsCount(collection)
    }
    return collections
  }

  async findOrFail(id: string): Promise<Collection> {
    return this.collectionRepository.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    return this.collectionRepository.findBySlug(slug)
  }

  async findDetail(id: string): Promise<Collection> {
    const collection = await this.collectionRepository.findWithRulesOrFail(id)
    await this.attachProductsCount(collection)
    return collection
  }

  async create(input: CreateCollectionInput): Promise<Collection> {
    const sortOrder = input.sortOrder ?? DEFAULT_SORT_ORDER[input.type]
    this.checkRules(input.type, sortOrder, input.rules ?? [])
    const slug = await this.resolveSlug(input.slug, input.title)

    const { data, rules } = this.draft({ ...input, slug })
    return this.collectionRepository.createWithRules(data, rules)
  }

  /**
   * The type can't change after creation. The slug only changes when one is
   * given, so editing the title doesn't break existing links.
   */
  async update(collection: Collection, input: UpdateCollectionInput): Promise<Collection> {
    const sortOrder = input.sortOrder ?? collection.sortOrder
    const checked = this.checkRules(collection.type, sortOrder, input.rules ?? null)
    const rules = input.rules === undefined ? undefined : checked

    const data: Partial<CollectionData> = {
      title: input.title,
      description:
        input.description === undefined ? undefined : sanitizeEditorHtml(input.description),
      status: input.status,
      sortOrder,
    }
    if (input.match !== undefined) data.match = input.match
    if (input.seoTitle !== undefined) data.seoTitle = blankToNull(input.seoTitle)
    if (input.seoDescription !== undefined) {
      data.seoDescription = blankToNull(input.seoDescription)
    }
    if (blankToNull(input.slug)) {
      data.slug = await this.resolveSlug(input.slug, input.title, collection.id)
    }

    return this.collectionRepository.updateWithRules(collection, data, rules)
  }

  /**
   * The new file is written before the collection points at it, and the
   * previous file is removed only after the collection is saved.
   */
  async setImage(collection: Collection, file: MultipartFile): Promise<Collection> {
    const previous = collection.image
    const { key } = await uploadImage(file, COLLECTION_IMAGE_FOLDER)
    const saved = await this.collectionRepository.setImage(collection, key)
    if (previous) await deleteImages([previous])
    return saved
  }

  async removeImage(collection: Collection): Promise<Collection> {
    const previous = collection.image
    if (!previous) return collection
    const saved = await this.collectionRepository.setImage(collection, null)
    await deleteImages([previous])
    return saved
  }

  async archive(collection: Collection): Promise<Collection> {
    return this.collectionRepository.setStatus(collection, 'archived', DateTime.now())
  }

  /**
   * Unarchived collections return as drafts so they are not published by
   * accident.
   */
  async unarchive(collection: Collection): Promise<Collection> {
    return this.collectionRepository.setStatus(collection, 'draft', null)
  }

  /**
   * Publishes or unpublishes many collections, restoring archived ones to
   * that status. Ones already at `status` are skipped.
   */
  async bulkSetStatus(
    ids: string[],
    status: Exclude<CollectionStatus, 'archived'>
  ): Promise<BulkResult> {
    return this.setStatusMany(ids, 'any', status, null)
  }

  /**
   * Archives (or, with `archived = false`, unarchives to draft) many
   * collections. Ones already in the requested state are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    return archived
      ? this.setStatusMany(ids, 'unarchived', 'archived', DateTime.now())
      : this.setStatusMany(ids, 'archived', 'draft', null)
  }

  protected async setStatusMany(
    ids: string[],
    from: BulkStatusSource,
    status: CollectionStatus,
    archivedAt: DateTime | null
  ): Promise<BulkResult> {
    const changed = await this.collectionRepository.setStatusMany(ids, from, status, archivedAt)
    await this.auditLogService.recordBulkUpdate(Collection, changed, { status, archivedAt })
    return bulkResult(ids, changed)
  }

  async paginateProducts(id: string, page: number, perPage: number) {
    const collection = await this.collectionRepository.findWithRulesOrFail(id)
    return this.collectionRepository.paginateProducts(collection, page, perPage)
  }

  async preview({ match, sortOrder, rules }: PreviewInput) {
    const found = ruleErrors(rules)
    if (found.length > 0) throw new errors.E_VALIDATION_ERROR(found)

    const effectiveSort = sortOrder === 'manual' ? DEFAULT_SORT_ORDER.automated : sortOrder
    return this.collectionRepository.previewProducts(
      { match, rules: normalizeRules(rules) },
      effectiveSort,
      PREVIEW_LIMIT
    )
  }

  async addProducts(collection: Collection, productIds: string[]): Promise<number> {
    return this.collectionRepository.addProducts(collection.id, productIds)
  }

  async removeProduct(collection: Collection, productId: string): Promise<void> {
    const removed = await this.collectionRepository.removeProduct(collection.id, productId)
    if (!removed) throw new lucidErrors.E_ROW_NOT_FOUND()
  }

  /**
   * Moves a product to a zero-based position (clamped to the end) and
   * renumbers only the entries between its old and new place.
   */
  async moveProduct(collection: Collection, productId: string, position: number): Promise<void> {
    const order = await this.collectionRepository.entryProductIds(collection.id)
    const from = order.indexOf(productId)
    if (from === -1) throw new lucidErrors.E_ROW_NOT_FOUND()

    const to = Math.min(position, order.length - 1)
    if (from === to) return

    order.splice(from, 1)
    order.splice(to, 0, productId)
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    const changes = order
      .slice(start, end + 1)
      .map((id, offset) => ({ productId: id, position: start + offset }))

    await this.collectionRepository.setPositions(collection.id, changes)
  }

  protected async attachProductsCount(collection: Collection): Promise<void> {
    if (collection.isManual) {
      collection.$extras.products_count = Number(collection.$extras.entries_count ?? 0)
      return
    }
    collection.$extras.products_count = await this.collectionRepository.countMatching({
      rules: collection.rules,
      match: collection.match,
    })
  }

  /**
   * Validates rules against the collection type and returns them
   * normalized. Pass `null` to only check the sort order.
   */
  protected checkRules(
    type: CollectionType,
    sortOrder: CollectionSortOrder,
    rules: CollectionRuleData[] | null
  ): CollectionRuleData[] {
    const found = this.ruleProblems(type, sortOrder, rules)
    if (found.length > 0) throw new errors.E_VALIDATION_ERROR(found)
    return normalizeRules(rules ?? [])
  }

  /**
   * A new collection checked without saving it (CSV import): the field
   * errors `create` would raise for its rules and sort order, and the data
   * to insert. `slug` is used as given; the caller checks it is free.
   */
  draft(input: CreateCollectionInput & { slug: string }): {
    errors: FieldError[]
    data: CollectionData
    rules: CollectionRuleData[]
  } {
    const sortOrder = input.sortOrder ?? DEFAULT_SORT_ORDER[input.type]
    const rules = input.rules ?? []
    return {
      errors: this.ruleProblems(input.type, sortOrder, rules),
      rules: normalizeRules(rules),
      data: {
        title: input.title,
        slug: input.slug,
        description: sanitizeEditorHtml(input.description),
        type: input.type,
        match: input.match ?? 'all',
        sortOrder,
        seoTitle: blankToNull(input.seoTitle),
        seoDescription: blankToNull(input.seoDescription),
        status: input.status,
      },
    }
  }

  protected ruleProblems(
    type: CollectionType,
    sortOrder: CollectionSortOrder,
    rules: CollectionRuleData[] | null
  ): FieldError[] {
    const found: FieldError[] = []

    if (type === 'automated' && sortOrder === 'manual') {
      found.push({
        field: 'sortOrder',
        message: 'Automated collections cannot be sorted by hand',
        rule: 'collectionSort',
      })
    }

    if (rules !== null) {
      if (type === 'manual' && rules.length > 0) {
        found.push({
          field: 'rules',
          message: 'Manual collections do not use conditions',
          rule: 'collectionRules',
        })
      }
      if (type === 'automated' && rules.length === 0) {
        found.push({ field: 'rules', message: 'Add at least one condition', rule: 'required' })
      }
      if (rules.length > MAX_COLLECTION_RULES) {
        found.push({
          field: 'rules',
          message: `Use at most ${MAX_COLLECTION_RULES} conditions`,
          rule: 'maxLength',
        })
      }
      found.push(...ruleErrors(rules))
    }

    return found
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
      const existing = await this.collectionRepository.findBySlug(slug)
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
    const base = string.slug(title, { lower: true, strict: true }) || 'collection'
    let slug = base
    let suffix = 2

    for (;;) {
      const existing = await this.collectionRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) {
        return slug
      }
      slug = `${base}-${suffix++}`
    }
  }
}
