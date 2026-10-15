import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_SHIPPING_ZONES_SORT_KEYS = ['name', 'createdAt'] as const

export const AdminShippingZonesSortKeySchema = z.enum(ADMIN_SHIPPING_ZONES_SORT_KEYS)

export type AdminShippingZonesSortKey = z.infer<typeof AdminShippingZonesSortKeySchema>

export const AdminShippingZoneStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminShippingZoneStatusFilter = z.infer<typeof AdminShippingZoneStatusFilterSchema>

export const AdminShippingZoneSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  countriesCount: z.number().nullable(),
  regionsCount: z.number().nullable(),
  ratesCount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminShippingZone = z.infer<typeof AdminShippingZoneSchema>

export const AdminShippingRateSchema = z.object({
  id: z.uuid(),
  shippingZoneId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  minSubtotal: z.number().nullable(),
  maxSubtotal: z.number().nullable(),
  minWeight: z.number().nullable(),
  maxWeight: z.number().nullable(),
  minItems: z.number().nullable(),
  maxItems: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  marketPrices: z.array(
    z.object({
      marketId: z.uuid(),
      price: z.number(),
      minSubtotal: z.number().nullable(),
      maxSubtotal: z.number().nullable(),
    })
  ),
})

export type AdminShippingRate = z.infer<typeof AdminShippingRateSchema>

export const AdminShippingZoneDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  countryCodes: z.array(z.string()),
  regionCodes: z.array(z.string()),
  rates: z.array(AdminShippingRateSchema),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminShippingZoneDetail = z.infer<typeof AdminShippingZoneDetailSchema>

export const AdminShippingZonesListQuerySchema = z.object({
  q: z.string(),
  status: AdminShippingZoneStatusFilterSchema,
  sort: AdminShippingZonesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminShippingZonesListQuery = z.infer<typeof AdminShippingZonesListQuerySchema>

export const AdminShippingZonesListResponseSchema = paginatedResponse(AdminShippingZoneSchema)

export const AdminShippingZoneResponseSchema = z.object({ data: AdminShippingZoneSchema })

export const AdminShippingZoneDetailResponseSchema = z.object({
  data: AdminShippingZoneDetailSchema,
})

export const AdminShippingRateResponseSchema = z.object({ data: AdminShippingRateSchema })

export const AdminShippingRegionOwnerSchema = z.object({
  regionCode: z.string(),
  zoneId: z.uuid(),
  zoneName: z.string(),
})

export type AdminShippingRegionOwner = z.infer<typeof AdminShippingRegionOwnerSchema>

export const AdminShippingRegionOwnersResponseSchema = z.object({
  data: z.array(AdminShippingRegionOwnerSchema),
})

export const AdminShippingMarketCountriesResponseSchema = z.object({
  data: z.object({ countryCodes: z.array(z.string()) }),
})

export const AdminShippingZoneFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must have at least 2 characters')
    .max(100, 'Name must have at most 100 characters'),
  countryCodes: z.array(z.string().length(2)),
  regionCodes: z.array(z.string().min(3).max(10)).optional(),
})

export type AdminShippingZoneForm = z.infer<typeof AdminShippingZoneFormSchema>

const amount = z.number().min(0, 'Amount cannot be negative').max(9_999_999_999.99)

const weight = z.number().min(0, 'Weight cannot be negative').max(99_999)

const itemCount = z
  .number()
  .int('Enter a whole number')
  .min(1, 'Enter at least 1 item')
  .max(10_000, 'Enter at most 10,000 items')

const notBelow = (min: number | null | undefined, max: number | null | undefined) =>
  min === null || min === undefined || max === null || max === undefined || max >= min

export const AdminShippingRateMarketPriceFormSchema = z
  .object({
    marketId: z.uuid(),
    price: amount,
    minSubtotal: amount.nullable(),
    maxSubtotal: amount.nullable(),
  })
  .refine(({ minSubtotal, maxSubtotal }) => notBelow(minSubtotal, maxSubtotal), {
    path: ['maxSubtotal'],
    message: 'Maximum must be at least the minimum',
  })

export const AdminShippingRateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name').max(100),
    description: z
      .string()
      .trim()
      .max(255, 'Description must have at most 255 characters')
      .nullable(),
    price: z
      .number({ error: 'Enter a price' })
      .min(0, 'Price cannot be negative')
      .max(9_999_999_999.99),
    minSubtotal: amount.nullable(),
    maxSubtotal: amount.nullable(),
    minWeight: weight.nullable(),
    maxWeight: weight.nullable(),
    minItems: itemCount.nullable(),
    maxItems: itemCount.nullable(),
    isActive: z.boolean(),
    /** Prices in non-primary markets; a market left out doesn't offer the rate. */
    marketPrices: z.array(AdminShippingRateMarketPriceFormSchema).optional(),
  })
  .refine(({ minSubtotal, maxSubtotal }) => notBelow(minSubtotal, maxSubtotal), {
    path: ['maxSubtotal'],
    message: 'Maximum subtotal must be at least the minimum subtotal',
  })
  .refine(({ minWeight, maxWeight }) => notBelow(minWeight, maxWeight), {
    path: ['maxWeight'],
    message: 'Maximum weight must be at least the minimum weight',
  })
  .refine(({ minItems, maxItems }) => notBelow(minItems, maxItems), {
    path: ['maxItems'],
    message: 'Maximum items must be at least the minimum items',
  })

export type AdminShippingRateForm = z.infer<typeof AdminShippingRateFormSchema>
