import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_VENDORS_SORT_KEYS = ['name', 'productsCount', 'createdAt'] as const

export const AdminVendorsSortKeySchema = z.enum(ADMIN_VENDORS_SORT_KEYS)

export type AdminVendorsSortKey = z.infer<typeof AdminVendorsSortKeySchema>

export const AdminVendorStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminVendorStatusFilter = z.infer<typeof AdminVendorStatusFilterSchema>

export const AdminVendorSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  imageUrl: z.string().nullable(),
  productsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminVendor = z.infer<typeof AdminVendorSchema>

export const AdminVendorsListQuerySchema = z.object({
  q: z.string(),
  status: AdminVendorStatusFilterSchema,
  sort: AdminVendorsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminVendorsListQuery = z.infer<typeof AdminVendorsListQuerySchema>

export const AdminVendorsListResponseSchema = paginatedResponse(AdminVendorSchema)

export const AdminVendorResponseSchema = z.object({ data: AdminVendorSchema })

export const AdminVendorFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100, 'Name must have at most 100 characters'),
})

export type AdminVendorForm = z.infer<typeof AdminVendorFormSchema>

/** Same limits as the server's `adminVendorImageStoreValidator`. */
export const VENDOR_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

export const MAX_VENDOR_IMAGE_UPLOAD_SIZE_MB = 5

/** Same order as the server's CSV columns. */
export const VENDOR_IMPORT_COLUMNS = ['name', 'status'] as const
