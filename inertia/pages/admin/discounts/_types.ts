import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_DISCOUNTS_SORT_KEYS = ['title', 'startsAt', 'createdAt'] as const

export const AdminDiscountsSortKeySchema = z.enum(ADMIN_DISCOUNTS_SORT_KEYS)

export type AdminDiscountsSortKey = z.infer<typeof AdminDiscountsSortKeySchema>

export const DISCOUNT_TYPES = [
  'amount_off_products',
  'buy_x_get_y',
  'amount_off_order',
  'free_shipping',
] as const

export const DiscountTypeSchema = z.enum(DISCOUNT_TYPES)

export type DiscountType = z.infer<typeof DiscountTypeSchema>

export const AdminDiscountTypeFilterSchema = z.enum(['', ...DISCOUNT_TYPES])

export type AdminDiscountTypeFilter = z.infer<typeof AdminDiscountTypeFilterSchema>

export const DiscountAppliesToSchema = z.enum(['products', 'collections'])

export type DiscountAppliesTo = z.infer<typeof DiscountAppliesToSchema>

export const DiscountBuyRequirementSchema = z.enum(['quantity', 'amount'])

export type DiscountBuyRequirement = z.infer<typeof DiscountBuyRequirementSchema>

/** Buy X get Y "At a discounted value" choice; `free` is 100% off. */
export const DiscountGetValueSchema = z.enum(['free', 'percentage', 'fixed_amount'])

export const DiscountTargetItemSchema = z.object({ id: z.uuid(), title: z.string() })

export type DiscountTargetItem = z.infer<typeof DiscountTargetItemSchema>

const DiscountTargetGroupSchema = z.object({
  products: z.array(DiscountTargetItemSchema),
  collections: z.array(DiscountTargetItemSchema),
})

export const DiscountMethodSchema = z.enum(['code', 'automatic'])

export type DiscountMethod = z.infer<typeof DiscountMethodSchema>

export const DiscountValueTypeSchema = z.enum(['percentage', 'fixed_amount'])

export type DiscountValueType = z.infer<typeof DiscountValueTypeSchema>

export const DiscountStatusSchema = z.enum(['active', 'scheduled', 'expired', 'archived'])

export type DiscountStatus = z.infer<typeof DiscountStatusSchema>

export const AdminDiscountStatusFilterSchema = z.enum([
  '',
  'active',
  'scheduled',
  'expired',
  'archived',
])

export type AdminDiscountStatusFilter = z.infer<typeof AdminDiscountStatusFilterSchema>

export const AdminDiscountSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  type: DiscountTypeSchema,
  code: z.string().nullable(),
  method: DiscountMethodSchema,
  valueType: DiscountValueTypeSchema,
  value: z.number().nullable(),
  appliesTo: DiscountAppliesToSchema.nullable(),
  buyRequirement: DiscountBuyRequirementSchema.nullable(),
  buyValue: z.number().nullable(),
  buyAppliesTo: DiscountAppliesToSchema.nullable(),
  getQuantity: z.number().nullable(),
  maxUsesPerOrder: z.number().nullable(),
  maxShippingPrice: z.number().nullable(),
  targets: z
    .object({
      applies: DiscountTargetGroupSchema,
      buy: DiscountTargetGroupSchema,
      get: DiscountTargetGroupSchema,
    })
    .nullable(),
  minSubtotal: z.number().nullable(),
  usageLimit: z.number().nullable(),
  usageCount: z.number(),
  oncePerCustomer: z.boolean(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  status: DiscountStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminDiscount = z.infer<typeof AdminDiscountSchema>

export const AdminDiscountsListQuerySchema = z.object({
  q: z.string(),
  status: AdminDiscountStatusFilterSchema,
  type: AdminDiscountTypeFilterSchema,
  sort: AdminDiscountsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminDiscountsListQuery = z.infer<typeof AdminDiscountsListQuerySchema>

export const AdminDiscountsListResponseSchema = paginatedResponse(AdminDiscountSchema)

export const AdminDiscountResponseSchema = z.object({ data: AdminDiscountSchema })

const amount = z.number().min(0, 'Amount cannot be negative').max(9_999_999_999.99)

const positive = (message: string) =>
  z.number({ error: message }).min(0.01, 'Value must be more than 0').max(9_999_999_999.99)

const wholeCount = (message: string) =>
  z.number({ error: message }).int('Enter a whole number').min(1, 'Enter at least 1').max(10_000)

const ids = z.array(z.uuid())

/** Product and collection id limits match the server's. */
export const MAX_DISCOUNT_PRODUCTS = 100

export const MAX_DISCOUNT_COLLECTIONS = 50

/**
 * The create/update payload. Fields a `type` doesn't use are left out
 * (`undefined`) by the form; the refinements require the ones it does.
 */
export const AdminDiscountFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').max(255),
    type: DiscountTypeSchema,
    method: DiscountMethodSchema,
    code: z
      .string()
      .trim()
      .min(3, 'Code must have at least 3 characters')
      .max(64, 'Code must have at most 64 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dashes and underscores')
      .nullable(),
    valueType: DiscountValueTypeSchema.optional(),
    value: positive('Enter a value').optional(),
    appliesTo: DiscountAppliesToSchema.optional(),
    productIds: ids.max(MAX_DISCOUNT_PRODUCTS, 'Choose at most 100 products').optional(),
    collectionIds: ids.max(MAX_DISCOUNT_COLLECTIONS, 'Choose at most 50 collections').optional(),
    buyRequirement: DiscountBuyRequirementSchema.optional(),
    buyValue: positive('Enter how much the customer buys').optional(),
    buyAppliesTo: DiscountAppliesToSchema.optional(),
    buyProductIds: ids.max(MAX_DISCOUNT_PRODUCTS, 'Choose at most 100 products').optional(),
    buyCollectionIds: ids.max(MAX_DISCOUNT_COLLECTIONS, 'Choose at most 50 collections').optional(),
    getQuantity: wholeCount('Enter how many items the customer gets').optional(),
    maxUsesPerOrder: wholeCount('Enter a number').nullable().optional(),
    maxShippingPrice: amount.nullable().optional(),
    minSubtotal: amount.nullable(),
    usageLimit: z
      .number()
      .int('Enter a whole number')
      .min(1, 'Limit must be at least 1')
      .nullable(),
    oncePerCustomer: z.boolean(),
    startsAt: z.iso.datetime({ offset: true, error: 'Choose a start date' }),
    endsAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .refine(({ method, code }) => method !== 'code' || code !== null, {
    path: ['code'],
    message: 'Enter a discount code',
  })
  .refine(({ type, value }) => type === 'free_shipping' || value !== undefined, {
    path: ['value'],
    message: 'Enter a value',
  })
  .refine(
    ({ valueType, value }) => valueType !== 'percentage' || value === undefined || value <= 100,
    { path: ['value'], message: 'A percentage cannot be more than 100' }
  )
  .refine(
    ({ type, appliesTo, productIds }) =>
      !(type === 'amount_off_products' || type === 'buy_x_get_y') ||
      appliesTo !== 'products' ||
      (productIds?.length ?? 0) > 0,
    { path: ['productIds'], message: 'Choose at least one product' }
  )
  .refine(
    ({ type, appliesTo, collectionIds }) =>
      !(type === 'amount_off_products' || type === 'buy_x_get_y') ||
      appliesTo !== 'collections' ||
      (collectionIds?.length ?? 0) > 0,
    { path: ['collectionIds'], message: 'Choose at least one collection' }
  )
  .refine(
    ({ type, buyAppliesTo, buyProductIds }) =>
      type !== 'buy_x_get_y' || buyAppliesTo !== 'products' || (buyProductIds?.length ?? 0) > 0,
    { path: ['buyProductIds'], message: 'Choose at least one product' }
  )
  .refine(
    ({ type, buyAppliesTo, buyCollectionIds }) =>
      type !== 'buy_x_get_y' ||
      buyAppliesTo !== 'collections' ||
      (buyCollectionIds?.length ?? 0) > 0,
    { path: ['buyCollectionIds'], message: 'Choose at least one collection' }
  )
  .refine(({ type, buyValue }) => type !== 'buy_x_get_y' || buyValue !== undefined, {
    path: ['buyValue'],
    message: 'Enter how much the customer buys',
  })
  .refine(
    ({ type, buyRequirement, buyValue }) =>
      type !== 'buy_x_get_y' ||
      buyRequirement !== 'quantity' ||
      buyValue === undefined ||
      Number.isInteger(buyValue),
    { path: ['buyValue'], message: 'Enter a whole number of items' }
  )
  .refine(({ type, getQuantity }) => type !== 'buy_x_get_y' || getQuantity !== undefined, {
    path: ['getQuantity'],
    message: 'Enter how many items the customer gets',
  })
  .refine(({ startsAt, endsAt }) => endsAt === null || new Date(endsAt) > new Date(startsAt), {
    path: ['endsAt'],
    message: 'End date must be after the start date',
  })

export type AdminDiscountForm = z.infer<typeof AdminDiscountFormSchema>
