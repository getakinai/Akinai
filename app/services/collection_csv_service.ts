import { inject } from '@adonisjs/core'
import type { Infer } from '@vinejs/vine/types'
import Collection from '#models/collection'
import {
  COLLECTION_RULE_FIELDS,
  COLLECTION_RULE_OPERATORS_LIST,
  type CollectionRuleData,
  type CollectionRuleField,
  type CollectionRuleOperator,
} from '#models/collection_rule'
import CollectionRepository, { type CollectionData } from '#repositories/collection_repository'
import AuditLogService from '#services/audit_log_service'
import BaseCsvTransferService, { type CsvRowReporter } from '#services/base_csv_transfer_service'
import CollectionService from '#services/collection_service'
import { adminCollectionImportRowValidator } from '#validators/admin_collection_import_row_validator'
import type { adminCollectionsExportQueryValidator } from '#validators/admin_collections_export_query_validator'

export const COLLECTION_CSV_COLUMNS = [
  'handle',
  'title',
  'description',
  'status',
  'type',
  'match',
  'sort_order',
  'seo_title',
  'seo_description',
  'rules',
] as const

type Column = (typeof COLLECTION_CSV_COLUMNS)[number]
type Row = Infer<typeof adminCollectionImportRowValidator>
type CreateData = { data: CollectionData; rules: CollectionRuleData[] }
type Filters = Infer<typeof adminCollectionsExportQueryValidator>

const RULE_LINE = /^(\S+)\s+(\S+)(?:\s+(.*))?$/

const isRuleField = (value: string): value is CollectionRuleField =>
  (COLLECTION_RULE_FIELDS as readonly string[]).includes(value)

const isRuleOperator = (value: string): value is CollectionRuleOperator =>
  (COLLECTION_RULE_OPERATORS_LIST as readonly string[]).includes(value)

/**
 * Collections as CSV, one row per collection. Automated collections keep
 * their rules in the `rules` cell, one `field operator value` per line
 * (e.g. `vendor equals Acme`). Manual product picks are not included.
 * The handle is the unique key. Archived collections export as `draft`.
 */
@inject()
export default class CollectionCsvService extends BaseCsvTransferService<
  Column,
  Row,
  CreateData,
  Collection,
  Filters
> {
  protected readonly columns = COLLECTION_CSV_COLUMNS
  protected readonly noun = ['collection', 'collections'] as const
  protected readonly keyColumn = 'handle' as const
  protected readonly lowercaseColumns = ['status', 'type', 'match', 'sort_order'] as const
  protected readonly Model = Collection
  protected readonly exportEvent = 'collections_exported' as const

  constructor(
    auditLogService: AuditLogService,
    protected collectionRepository: CollectionRepository,
    protected collectionService: CollectionService
  ) {
    super(auditLogService)
  }

  protected async sampleRows(suffix: string) {
    return [
      {
        handle: `staff-picks-${suffix}`,
        title: 'Staff picks',
        description: '<p>Hand-picked favourites.</p>',
        status: 'active',
        type: 'manual',
        match: '',
        sort_order: 'manual',
        seo_title: '',
        seo_description: '',
        rules: '',
      },
      {
        handle: `summer-under-500-${suffix}`,
        title: 'Summer under 500',
        description: '',
        status: 'draft',
        type: 'automated',
        match: 'all',
        sort_order: 'best_selling',
        seo_title: 'Summer deals',
        seo_description: '',
        rules: 'tag equals summer\nvariant_price less_than 500',
      },
    ]
  }

  protected validateRow(cells: Record<string, string>) {
    return adminCollectionImportRowValidator.validate(cells)
  }

  protected keyOf(row: Row) {
    return row.handle
  }

  protected existingKeys(keys: string[]) {
    return this.collectionRepository.slugsIn(keys)
  }

  protected fetchForExport(filters: Filters, limit: number) {
    return this.collectionRepository.exportRows(
      {
        q: filters.q || undefined,
        status: filters.status,
        type: filters.type,
        sort: filters.sort ?? 'updatedAt',
        direction: filters.direction ?? 'desc',
      },
      limit
    )
  }

  protected toCsvRow(collection: Collection) {
    return {
      handle: collection.slug,
      title: collection.title,
      description: collection.description ?? '',
      status: collection.status === 'active' ? 'active' : 'draft',
      type: collection.type,
      match: collection.match,
      sort_order: collection.sortOrder,
      seo_title: collection.seoTitle ?? '',
      seo_description: collection.seoDescription ?? '',
      rules: collection.rules
        .map(({ field, operator, value }) => [field, operator, value].filter(Boolean).join(' '))
        .join('\n'),
    }
  }

  protected build(row: Row, report: CsvRowReporter): CreateData {
    const rules = this.parseRules(row.rules ?? '', report)
    const draft = this.collectionService.draft({
      slug: row.handle,
      title: row.title,
      description: row.description ?? null,
      status: row.status ?? 'draft',
      type: row.type,
      match: row.match,
      sortOrder: row.sort_order,
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
      rules,
    })

    for (const { field, message } of draft.errors) {
      const rule = /^rules\.(\d+)\./.exec(field)
      if (rule) report('rules', `Rule ${Number(rule[1]) + 1}: ${message}.`)
      else report(field === 'sortOrder' ? 'sort_order' : field, `${message}.`)
    }
    return { data: draft.data, rules: draft.rules }
  }

  protected parseRules(cell: string, report: CsvRowReporter): CollectionRuleData[] {
    const lines = cell
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    return lines.flatMap((line, index) => {
      const [, field = '', operator = '', value = null] = RULE_LINE.exec(line) ?? []
      const fieldKey = field.toLowerCase()
      const operatorKey = operator.toLowerCase()
      if (!isRuleField(fieldKey)) {
        report('rules', `Rule ${index + 1}: "${field || line}" is not a rule field.`)
        return []
      }
      if (!isRuleOperator(operatorKey)) {
        report('rules', `Rule ${index + 1}: "${operator}" is not a rule condition.`)
        return []
      }
      return [{ field: fieldKey, operator: operatorKey, value }]
    })
  }

  protected createMany(data: CreateData[]) {
    return this.collectionRepository.createManyWithRules(data)
  }
}
