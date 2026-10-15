import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_MARKETS_SORT_KEYS = ['name', 'createdAt'] as const

export const AdminMarketsSortKeySchema = z.enum(ADMIN_MARKETS_SORT_KEYS)

export type AdminMarketsSortKey = z.infer<typeof AdminMarketsSortKeySchema>

export const AdminMarketStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminMarketStatusFilter = z.infer<typeof AdminMarketStatusFilterSchema>

export const AdminMarketSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  handle: z.string(),
  currencyCode: z.string(),
  pricesIncludeTax: z.boolean(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  countriesCount: z.number().nullable(),
  countryCodes: z.array(z.string()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminMarket = z.infer<typeof AdminMarketSchema>

export const AdminMarketsListQuerySchema = z.object({
  q: z.string(),
  status: AdminMarketStatusFilterSchema,
  sort: AdminMarketsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminMarketsListQuery = z.infer<typeof AdminMarketsListQuerySchema>

export const AdminMarketsListResponseSchema = paginatedResponse(AdminMarketSchema)

export const AdminMarketResponseSchema = z.object({ data: AdminMarketSchema })

const marketName = z
  .string()
  .trim()
  .min(2, 'Name must have at least 2 characters')
  .max(100, 'Name must have at most 100 characters')

const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, 'Choose a currency')

export const AdminMarketCreateFormSchema = z.object({
  name: marketName,
  currencyCode,
  pricesIncludeTax: z.boolean(),
  countryCodes: z.array(z.string().length(2)),
})

export type AdminMarketCreateForm = z.infer<typeof AdminMarketCreateFormSchema>

export const AdminMarketUpdateFormSchema = AdminMarketCreateFormSchema.extend({
  handle: z
    .string()
    .trim()
    .min(1, 'Enter a handle')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
})

export type AdminMarketUpdateForm = z.infer<typeof AdminMarketUpdateFormSchema>
