import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { seoFormFields } from '~/lib/seo'
import { AdminProductListItemSchema } from '../products/_types'

export const COLLECTION_TYPES = ['manual', 'automated'] as const

export const COLLECTION_MATCHES = ['all', 'any'] as const

export const COLLECTION_SORT_ORDERS = [
  'manual',
  'best_selling',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
  'created_desc',
  'created_asc',
] as const

export const COLLECTION_STATUSES = ['draft', 'active', 'archived'] as const

export const COLLECTION_RULE_FIELDS = [
  'title',
  'product_type',
  'vendor',
  'tag',
  'variant_price',
  'compare_at_price',
  'inventory_available',
  'option_value',
] as const

export const COLLECTION_RULE_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'is_set',
  'is_not_set',
] as const

export const MAX_COLLECTION_RULES = 60

export const COLLECTION_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

export const MAX_COLLECTION_IMAGE_UPLOAD_SIZE_MB = 5

export const ADMIN_COLLECTIONS_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const CollectionTypeSchema = z.enum(COLLECTION_TYPES)
export type CollectionType = z.infer<typeof CollectionTypeSchema>

export const CollectionMatchSchema = z.enum(COLLECTION_MATCHES)
export type CollectionMatch = z.infer<typeof CollectionMatchSchema>

export const CollectionSortOrderSchema = z.enum(COLLECTION_SORT_ORDERS)
export type CollectionSortOrder = z.infer<typeof CollectionSortOrderSchema>

export const CollectionStatusSchema = z.enum(COLLECTION_STATUSES)
export type CollectionStatus = z.infer<typeof CollectionStatusSchema>

export const CollectionRuleFieldSchema = z.enum(COLLECTION_RULE_FIELDS)
export type CollectionRuleField = z.infer<typeof CollectionRuleFieldSchema>

export const CollectionRuleOperatorSchema = z.enum(COLLECTION_RULE_OPERATORS)
export type CollectionRuleOperator = z.infer<typeof CollectionRuleOperatorSchema>

/**
 * Operators allowed for each field. Mirrors `app/models/collection_rule.ts`.
 */
export const RULE_OPERATORS_BY_FIELD: Record<
  CollectionRuleField,
  readonly CollectionRuleOperator[]
> = {
  title: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  product_type: ['equals', 'not_equals', 'contains', 'not_contains'],
  vendor: ['equals', 'not_equals', 'contains', 'not_contains'],
  tag: ['equals', 'not_equals'],
  variant_price: ['greater_than', 'less_than', 'equals'],
  compare_at_price: ['is_set', 'is_not_set', 'greater_than', 'less_than'],
  inventory_available: ['greater_than', 'less_than'],
  option_value: ['equals', 'not_equals'],
}

export const NUMERIC_RULE_FIELDS: readonly CollectionRuleField[] = [
  'variant_price',
  'compare_at_price',
  'inventory_available',
]

export const VALUELESS_RULE_OPERATORS: readonly CollectionRuleOperator[] = ['is_set', 'is_not_set']

export const AdminCollectionsSortKeySchema = z.enum(ADMIN_COLLECTIONS_SORT_KEYS)
export type AdminCollectionsSortKey = z.infer<typeof AdminCollectionsSortKeySchema>

export const AdminCollectionStatusFilterSchema = z.enum(['', ...COLLECTION_STATUSES])
export type AdminCollectionStatusFilter = z.infer<typeof AdminCollectionStatusFilterSchema>

export const AdminCollectionTypeFilterSchema = z.enum(['', ...COLLECTION_TYPES])
export type AdminCollectionTypeFilter = z.infer<typeof AdminCollectionTypeFilterSchema>

export const AdminCollectionRuleSchema = z.object({
  id: z.uuid(),
  field: CollectionRuleFieldSchema,
  operator: CollectionRuleOperatorSchema,
  value: z.string().nullable(),
  position: z.number(),
})

export const AdminCollectionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: CollectionTypeSchema,
  match: CollectionMatchSchema,
  sortOrder: CollectionSortOrderSchema,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  status: CollectionStatusSchema,
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  productsCount: z.number(),
  rules: z.array(AdminCollectionRuleSchema),
})

export type AdminCollection = z.infer<typeof AdminCollectionSchema>

export const AdminCollectionsListQuerySchema = z.object({
  q: z.string(),
  status: AdminCollectionStatusFilterSchema,
  type: AdminCollectionTypeFilterSchema,
  sort: AdminCollectionsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminCollectionsListQuery = z.infer<typeof AdminCollectionsListQuerySchema>

export const AdminCollectionsListResponseSchema = paginatedResponse(AdminCollectionSchema)

export const AdminCollectionResponseSchema = z.object({ data: AdminCollectionSchema })

export const AdminCollectionProductsResponseSchema = paginatedResponse(AdminProductListItemSchema)

export const AdminCollectionProductsAddResponseSchema = z.object({
  data: z.object({ added: z.number() }),
})

export const EmptyResponseSchema = z.null()

export const CollectionRuleFormSchema = z
  .object({
    field: CollectionRuleFieldSchema,
    operator: CollectionRuleOperatorSchema,
    value: z.string().trim().max(255).nullable(),
  })
  .superRefine((rule, context) => {
    if (!RULE_OPERATORS_BY_FIELD[rule.field].includes(rule.operator)) {
      context.addIssue({ code: 'custom', path: ['operator'], message: 'Choose a condition' })
      return
    }
    if (VALUELESS_RULE_OPERATORS.includes(rule.operator)) return
    if (!rule.value) {
      context.addIssue({ code: 'custom', path: ['value'], message: 'Enter a value' })
      return
    }
    if (NUMERIC_RULE_FIELDS.includes(rule.field)) {
      const amount = Number(rule.value)
      if (!Number.isFinite(amount) || amount < 0) {
        context.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'Enter a number of 0 or more',
        })
      }
    }
  })

export type CollectionRuleForm = z.infer<typeof CollectionRuleFormSchema>

const collectionFields = {
  title: z.string().trim().min(1, 'Enter a title').max(255),
  description: z.string().trim().max(10_000).nullable(),
  status: z.enum(['draft', 'active']),
  match: CollectionMatchSchema,
  sortOrder: CollectionSortOrderSchema,
  slug: z.string().trim().max(255).nullable(),
  ...seoFormFields,
  rules: z.array(CollectionRuleFormSchema).max(MAX_COLLECTION_RULES),
}

function refineCollection(
  value: { type: CollectionType; sortOrder: CollectionSortOrder; rules: CollectionRuleForm[] },
  context: z.RefinementCtx
) {
  if (value.type === 'automated' && value.rules.length === 0) {
    context.addIssue({ code: 'custom', path: ['rules'], message: 'Add at least one condition' })
  }
  if (value.type === 'automated' && value.sortOrder === 'manual') {
    context.addIssue({
      code: 'custom',
      path: ['sortOrder'],
      message: 'Automated collections cannot be sorted by hand',
    })
  }
}

export const CollectionCreateFormSchema = z
  .object({ type: CollectionTypeSchema, ...collectionFields })
  .superRefine(refineCollection)

export type CollectionCreateForm = z.infer<typeof CollectionCreateFormSchema>

export const CollectionUpdateFormSchema = z
  .object({ type: CollectionTypeSchema, ...collectionFields })
  .superRefine(refineCollection)
  .transform(({ type: _type, ...rest }) => rest)

export type CollectionUpdateForm = z.output<typeof CollectionUpdateFormSchema>

export const CollectionPreviewInputSchema = z.object({
  match: CollectionMatchSchema,
  sortOrder: CollectionSortOrderSchema,
  rules: z.array(CollectionRuleFormSchema).min(1).max(MAX_COLLECTION_RULES),
})

export type CollectionPreviewInput = z.infer<typeof CollectionPreviewInputSchema>

/** Same order as the server's CSV columns. */
export const COLLECTION_IMPORT_COLUMNS = [
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
