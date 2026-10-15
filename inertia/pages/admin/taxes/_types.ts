import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_TAX_RATES_SORT_KEYS = ['name', 'countryCode', 'rate', 'createdAt'] as const

export const AdminTaxRatesSortKeySchema = z.enum(ADMIN_TAX_RATES_SORT_KEYS)

export type AdminTaxRatesSortKey = z.infer<typeof AdminTaxRatesSortKeySchema>

export const AdminTaxRateStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminTaxRateStatusFilter = z.infer<typeof AdminTaxRateStatusFilterSchema>

export const AdminTaxRateSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  countryCode: z.string(),
  regionCode: z.string().nullable(),
  rate: z.number(),
  appliesToShipping: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminTaxRate = z.infer<typeof AdminTaxRateSchema>

export const AdminTaxRatesListQuerySchema = z.object({
  q: z.string(),
  status: AdminTaxRateStatusFilterSchema,
  sort: AdminTaxRatesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminTaxRatesListQuery = z.infer<typeof AdminTaxRatesListQuerySchema>

export const AdminTaxRatesListResponseSchema = paginatedResponse(AdminTaxRateSchema)

export const AdminTaxRateResponseSchema = z.object({ data: AdminTaxRateSchema })

export const AdminTaxRateFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100),
  countryCode: z.string().length(2, 'Choose a country'),
  regionCode: z
    .string()
    .trim()
    .max(10, 'Region code must have at most 10 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers and dashes')
    .nullable(),
  rate: z
    .number({ error: 'Enter a rate' })
    .min(0, 'Rate cannot be negative')
    .max(100, 'Rate cannot be more than 100%'),
  appliesToShipping: z.boolean(),
})

export type AdminTaxRateForm = z.infer<typeof AdminTaxRateFormSchema>
