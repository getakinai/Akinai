import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_LOCATIONS_SORT_KEYS = ['name', 'createdAt'] as const

export const AdminLocationsSortKeySchema = z.enum(ADMIN_LOCATIONS_SORT_KEYS)

export type AdminLocationsSortKey = z.infer<typeof AdminLocationsSortKeySchema>

export const AdminLocationStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminLocationStatusFilter = z.infer<typeof AdminLocationStatusFilterSchema>

export const AdminLocationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  availableTotal: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminLocation = z.infer<typeof AdminLocationSchema>

export const AdminLocationsListQuerySchema = z.object({
  q: z.string(),
  status: AdminLocationStatusFilterSchema,
  sort: AdminLocationsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminLocationsListQuery = z.infer<typeof AdminLocationsListQuerySchema>

export const AdminLocationsListResponseSchema = paginatedResponse(AdminLocationSchema)

export const AdminLocationResponseSchema = z.object({ data: AdminLocationSchema })

export const AdminLocationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must have at least 2 characters')
    .max(100, 'Name must have at most 100 characters'),
  addressLine: z.string().trim().max(255).nullable(),
  city: z.string().trim().max(100).nullable(),
  country: z.string().trim().max(100).nullable(),
})

export type AdminLocationForm = z.infer<typeof AdminLocationFormSchema>

/** Same order as the server's CSV columns. */
export const LOCATION_IMPORT_COLUMNS = [
  'name',
  'address_line',
  'city',
  'country',
  'status',
] as const
