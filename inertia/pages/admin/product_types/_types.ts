import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_PRODUCT_TYPES_SORT_KEYS = ['name', 'productsCount', 'createdAt'] as const

export const AdminProductTypesSortKeySchema = z.enum(ADMIN_PRODUCT_TYPES_SORT_KEYS)

export type AdminProductTypesSortKey = z.infer<typeof AdminProductTypesSortKeySchema>

export const AdminProductTypeStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminProductTypeStatusFilter = z.infer<typeof AdminProductTypeStatusFilterSchema>

export const AdminProductTypeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  productsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminProductType = z.infer<typeof AdminProductTypeSchema>

export const AdminProductTypesListQuerySchema = z.object({
  q: z.string(),
  status: AdminProductTypeStatusFilterSchema,
  sort: AdminProductTypesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminProductTypesListQuery = z.infer<typeof AdminProductTypesListQuerySchema>

export const AdminProductTypesListResponseSchema = paginatedResponse(AdminProductTypeSchema)

export const AdminProductTypeResponseSchema = z.object({ data: AdminProductTypeSchema })

export const AdminProductTypeFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100, 'Name must have at most 100 characters'),
})

export type AdminProductTypeForm = z.infer<typeof AdminProductTypeFormSchema>

/** Same order as the server's CSV columns. */
export const PRODUCT_TYPE_IMPORT_COLUMNS = ['name', 'status'] as const
