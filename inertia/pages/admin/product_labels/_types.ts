import { z } from 'zod'
import { ProductLabelColorSchema } from '~/lib/product_label'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_PRODUCT_LABELS_SORT_KEYS = ['name', 'productsCount', 'createdAt'] as const

export const AdminProductLabelsSortKeySchema = z.enum(ADMIN_PRODUCT_LABELS_SORT_KEYS)

export type AdminProductLabelsSortKey = z.infer<typeof AdminProductLabelsSortKeySchema>

export const AdminProductLabelStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminProductLabelStatusFilter = z.infer<typeof AdminProductLabelStatusFilterSchema>

export const AdminProductLabelSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: ProductLabelColorSchema,
  isActive: z.boolean(),
  productsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminProductLabel = z.infer<typeof AdminProductLabelSchema>

export const AdminProductLabelsListQuerySchema = z.object({
  q: z.string(),
  status: AdminProductLabelStatusFilterSchema,
  sort: AdminProductLabelsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminProductLabelsListQuery = z.infer<typeof AdminProductLabelsListQuerySchema>

export const AdminProductLabelsListResponseSchema = paginatedResponse(AdminProductLabelSchema)

export const AdminProductLabelResponseSchema = z.object({ data: AdminProductLabelSchema })

export const AdminProductLabelFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(40, 'Name must have at most 40 characters'),
  color: ProductLabelColorSchema,
})

export type AdminProductLabelForm = z.infer<typeof AdminProductLabelFormSchema>
